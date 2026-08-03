import { ref, onScopeDispose } from 'vue';
import type { GameSheet } from '../types';

/**
 * Where a sheet sync currently stands. `failed` is a request that didn't get
 * through and will be retried; `gone` is the platform saying the match itself
 * isn't there any more, which no amount of retrying fixes.
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed' | 'gone';

/**
 * GET the sheet stored under an edition code from its export endpoint.
 *
 * Returns the sheet on success, or `null` when there is nothing to load for that
 * code: any non-200 response, an unreachable server, or a body that isn't a
 * valid sheet. Callers treat `null` as "no such sheet / incorrect code".
 */
export async function fetchSheet(url: string): Promise<GameSheet | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status !== 200) return null;
    const data = await res.json();
    if (Array.isArray(data?.teams) && Array.isArray(data?.events)) {
      return { teams: data.teams, events: data.events };
    }
  } catch {
    // Offline, or a body that isn't JSON — treat as no sheet.
  }
  return null;
}

// Response codes that mean the match is no longer on the platform, rather than
// a request that merely didn't get through. Re-sending these would never work.
const GONE_STATUSES = [404, 410];

// How long to wait before each retry, growing so a server that stays down isn't
// hammered, but staying short enough that a match keeps flowing to the platform
// while it is being scored. The last value repeats for every further attempt.
const RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 40_000, 60_000];

/**
 * POST the sheet JSON to an export endpoint whenever it changes.
 *
 * `getUrl` is read lazily on each send so the caller can build the URL from the
 * current platform / edition code. Calls are debounced and de-duplicated on the
 * serialized JSON: identical payloads are skipped, and if the sheet changes
 * again while a request is in flight, only the newest payload is sent next.
 *
 * A send that doesn't get through keeps its payload queued and retries on a
 * growing delay (`retryIn` counts it down), so a flaky connection resolves
 * itself; `sendNow` skips the wait when the user wants to try immediately.
 * `unsent` stays true from the first failure until the platform accepts a
 * payload again, so the UI can say the sheet isn't saved yet.
 */
export function useSheetSync(getUrl: () => string, debounceMs = 400) {
  const status = ref<SyncStatus>('idle');
  /** Changes the platform hasn't accepted yet — cleared by the next success. */
  const unsent = ref(false);
  /** Seconds until the automatic retry, or 0 when none is scheduled. */
  const retryIn = ref(0);

  // The last payload the server accepted (200), so we don't re-send it.
  let lastSynced = '';
  // The newest payload waiting to be sent, or null when nothing is queued.
  let pending: string | null = null;
  let inFlight = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Consecutive failures, which pick the next delay out of RETRY_DELAYS_MS.
  let failures = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let countdown: ReturnType<typeof setInterval> | undefined;

  const clearRetry = () => {
    clearTimeout(retryTimer);
    clearInterval(countdown);
    retryTimer = undefined;
    countdown = undefined;
    retryIn.value = 0;
  };

  const scheduleRetry = () => {
    clearRetry();
    const delay = RETRY_DELAYS_MS[Math.min(failures - 1, RETRY_DELAYS_MS.length - 1)];
    retryIn.value = Math.round(delay / 1000);
    countdown = setInterval(() => {
      retryIn.value = Math.max(0, retryIn.value - 1);
    }, 1000);
    retryTimer = setTimeout(flush, delay);
  };

  // The send didn't get through. Keep the change queued — a payload that
  // arrived mid-request supersedes this one, since the sheet is cumulative —
  // and let the backoff decide when to try again.
  const fail = (body: string) => {
    if (pending === null) pending = body;
    failures += 1;
    unsent.value = true;
    status.value = 'failed';
    scheduleRetry();
  };

  const flush = async () => {
    if (inFlight || pending === null) return;
    clearRetry();
    const body = pending;
    pending = null;
    inFlight = true;
    status.value = 'syncing';
    let willRetry = false;
    try {
      const res = await fetch(getUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (res.status === 200) {
        lastSynced = body;
        failures = 0;
        unsent.value = false;
        status.value = 'synced';
      } else if (GONE_STATUSES.includes(res.status)) {
        // Nothing to retry against: the caller takes the match out of scoring.
        status.value = 'gone';
      } else {
        fail(body);
        willRetry = true;
      }
    } catch {
      // Network error / offline.
      fail(body);
      willRetry = true;
    } finally {
      inFlight = false;
      // A newer change arrived mid-request — send it now. After a failure the
      // retry timer owns the next attempt instead.
      if (pending !== null && !willRetry && status.value !== 'gone') flush();
    }
  };

  /** Queue the given sheet (any JSON-serializable value) for syncing. */
  const sync = (sheet: unknown) => {
    const body = JSON.stringify(sheet);
    if (body === lastSynced) return; // unchanged since the last successful sync
    pending = body;
    // While a retry is pending, the endpoint is known to be failing: let the
    // backoff pick the moment rather than trying again on every point scored.
    if (retryTimer) return;
    clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  /** Try the queued change right away, starting the backoff over if it fails. */
  const sendNow = () => {
    if (inFlight || pending === null) return;
    clearRetry();
    failures = 0;
    flush();
  };

  // Leaving the match stops the retries with it.
  onScopeDispose(() => {
    clearTimeout(timer);
    clearRetry();
  });

  return { status, unsent, retryIn, sync, sendNow };
}
