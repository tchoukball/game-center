import { ref } from 'vue';
import type { GameSheet } from '../types';

/** Where a sheet sync currently stands. */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

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

/**
 * POST the sheet JSON to an export endpoint whenever it changes.
 *
 * `getUrl` is read lazily on each send so the caller can build the URL from the
 * current platform / edition code. Calls are debounced and de-duplicated on the
 * serialized JSON: identical payloads are skipped, and if the sheet changes
 * again while a request is in flight, only the newest payload is sent next.
 */
export function useSheetSync(getUrl: () => string, debounceMs = 400) {
  const status = ref<SyncStatus>('idle');

  // The last payload the server accepted (200), so we don't re-send it.
  let lastSynced = '';
  // The newest payload waiting to be sent, or null when nothing is queued.
  let pending: string | null = null;
  let inFlight = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = async () => {
    if (inFlight || pending === null) return;
    const body = pending;
    pending = null;
    inFlight = true;
    status.value = 'syncing';
    try {
      const res = await fetch(getUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (res.status === 200) {
        lastSynced = body;
        status.value = 'synced';
      } else {
        status.value = 'failed';
      }
    } catch {
      // Network error / offline.
      status.value = 'failed';
    } finally {
      inFlight = false;
      // A newer change arrived mid-request — send it now.
      if (pending !== null) flush();
    }
  };

  /** Queue the given sheet (any JSON-serializable value) for syncing. */
  const sync = (sheet: unknown) => {
    const body = JSON.stringify(sheet);
    if (body === lastSynced) return; // unchanged since the last successful sync
    pending = body;
    clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  return { status, sync };
}
