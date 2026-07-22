import { reactive, computed, watch } from 'vue';
import {
  computeScores,
  currentPhase,
  currentPeriod,
  gameStartedAt,
} from '../types';
import type {
  GameSheet,
  TchoukTeam,
  TchoukEvent,
  TchoukEventType,
  TeamId,
} from '../types';

// Persist each match's sheet to localStorage so a refresh restores it. The key
// is versioned (so a future format change can invalidate old data) and scoped
// by `matchKey` so different matches (platform + id) never share a sheet.
const STORAGE_PREFIX = 'tchoukscorer:sheet:v1';

const storageKey = (matchKey: string) => `${STORAGE_PREFIX}:${matchKey}`;

/**
 * The key scoping one match's store and localStorage entry. Every caller builds
 * it through here so the two ends of a navigation always agree on the key.
 */
export const matchKey = (slug: string, edition: string) => `${slug}:${edition}`;

const loadSheet = (matchKey: string): GameSheet => {
  try {
    const raw = localStorage.getItem(storageKey(matchKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.teams) && Array.isArray(parsed?.events)) {
        return { teams: parsed.teams, events: parsed.events };
      }
    }
  } catch {
    // Unavailable or corrupt storage — start fresh.
  }
  return { teams: [], events: [] };
};

// Each match gets one store instance, cached by key so remounting the same
// match (e.g. navigating away and back) reuses the same reactive sheet.
type MatchStore = ReturnType<typeof createMatchStore>;
const stores = new Map<string, MatchStore>();

function createMatchStore(matchKey: string) {
  // THE single source of truth for this match: one sheet, holding only the
  // teams and the event log. Every other value below is *calculated* from
  // `sheet.events`.
  const sheet = reactive<GameSheet>(loadSheet(matchKey));

  // Save on every change to the single source of truth.
  watch(
    sheet,
    () => {
      try {
        localStorage.setItem(storageKey(matchKey), JSON.stringify(sheet));
      } catch {
        // Storage full or unavailable — ignore; in-memory state still works.
      }
    },
    { deep: true },
  );

  // Derived state — each of these recomputes whenever the one watched variable
  // (the sheet's event log) changes.
  const scores = computed(() => computeScores(sheet.events));
  const phase = computed(() => currentPhase(sheet.events));
  const period = computed(() => currentPeriod(sheet.events));
  const startedAt = computed(() => gameStartedAt(sheet.events));
  const canScore = computed(() => phase.value === 'period_started');
  const lastActionAt = computed(() => {
    const last = sheet.events[sheet.events.length - 1];
    return last ? last.at : null;
  });

  const recordEvent = (
    type: TchoukEventType,
    extra: Partial<TchoukEvent> = {},
  ) => {
    sheet.events.push({
      type,
      at: new Date().toISOString(),
      ...extra,
    });
  };

  const removeEvent = (index: number) => {
    if (index >= 0 && index < sheet.events.length) sheet.events.splice(index, 1);
  };

  const setTeams = (teams: TchoukTeam[]) => {
    sheet.teams = teams.map((t) => ({ id: t.id, name: t.name }));
  };

  // `teamId` is the team that benefits. With `givenBy`, an opponent conceded the
  // point: that opponent is the actor, the benefiting team is the target.
  const score = (teamId: TeamId, givenBy?: TeamId) => {
    if (givenBy != null) {
      recordEvent('score_point_given', {
        actor: { teamId: givenBy },
        target: { teamId },
        scoreChange: { teamId, increment: 1 },
      });
    } else {
      recordEvent('score_point_scored', {
        actor: { teamId },
        target: { teamId },
        scoreChange: { teamId, increment: 1 },
      });
    }
  };

  // A cancelled point has only a target (the team losing the point), no actor.
  const correct = (teamId: TeamId) => {
    if ((scores.value[teamId] ?? 0) > 0) {
      recordEvent('score_point_correction', {
        target: { teamId },
        scoreChange: { teamId, increment: -1 },
      });
    }
  };

  // Time / phase transitions. The UI only surfaces the ones valid for the
  // current phase (see PeriodTracker), but the store stays agnostic.
  const startGame = () => recordEvent('time_game_start');
  const startPeriod = () => recordEvent('time_period_start');
  const endPeriod = () => recordEvent('time_period_end');
  const endMatch = () => recordEvent('time_game_end');

  const reset = () => {
    sheet.events = [];
  };

  return {
    // single source of truth
    sheet,
    // derived
    scores,
    phase,
    period,
    startedAt,
    canScore,
    lastActionAt,
    // actions (the only way to mutate the sheet)
    setTeams,
    score,
    correct,
    removeEvent,
    startGame,
    startPeriod,
    endPeriod,
    endMatch,
    reset,
  };
}

/**
 * Prepopulate a match with a sheet fetched from the platform, before its game
 * center is opened. If the store is already live (the match was visited this
 * session) its sheet is replaced in place; otherwise the sheet is written to
 * localStorage so the store loads it when first created.
 */
export function seedSheet(matchKey: string, sheet: GameSheet) {
  const teams = Array.isArray(sheet.teams)
    ? sheet.teams.map((t) => ({ id: t.id, name: t.name }))
    : [];
  const events = Array.isArray(sheet.events) ? sheet.events : [];
  const store = stores.get(matchKey);
  if (store) {
    store.sheet.teams = teams;
    store.sheet.events = events;
    return;
  }
  try {
    localStorage.setItem(storageKey(matchKey), JSON.stringify({ teams, events }));
  } catch {
    // Storage unavailable — the fetched sheet just won't persist to disk.
  }
}

/**
 * The sheet currently held for a match, without creating a live store: the
 * in-memory sheet if the match is open this session, otherwise whatever is in
 * localStorage. Returns null when nothing is stored (no teams and no events) —
 * i.e. there is no local version to reconcile against a fetched one. The sheet
 * is the live one when the match is open, so treat it as read-only.
 */
export function peekSheet(key: string): GameSheet | null {
  const store = stores.get(key);
  const sheet = store ? store.sheet : loadSheet(key);
  if (sheet.teams.length === 0 && sheet.events.length === 0) return null;
  return sheet;
}

/**
 * Access the store for a specific match. `matchKey` scopes both the in-memory
 * instance and its localStorage entry — typically `"<platformSlug>:<matchId>"`.
 */
export function useMatchStore(matchKey: string) {
  let store = stores.get(matchKey);
  if (!store) {
    store = createMatchStore(matchKey);
    stores.set(matchKey, store);
  }
  return store;
}
