import { buildExportUrl } from '../config/platforms';
import type { PlatformConfig } from '../config/platforms';
import { fetchSheet } from './useSheetSync';
import { matchKey, peekSheet, seedSheet } from '../stores/useMatchStore';
import { useConfirm } from './useConfirm';
import { computeScores } from '../types';
import type { GameSheet, TchoukScoresType } from '../types';

/** What the user is told when a code has no match behind it, wherever they entered it. */
export const noSuchMatchMessage = (edition: string) =>
  `Edition code “${edition}” doesn’t match an existing match. Check it and try again.`;

// Codes confirmed to exist this session, so entering a match through the code
// form and then landing on its game center only costs one round trip.
const verified = new Set<string>();

// A one-line "Italy 5 – Switzerland 3" summary of a sheet's scores.
const formatScore = (sheet: GameSheet, scores: TchoukScoresType) =>
  sheet.teams.map((t) => `${t.name} ${scores[t.id] ?? 0}`).join(' – ');

// Whether two score maps disagree on any team.
const scoresDiffer = (a: TchoukScoresType, b: TchoukScoresType) => {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) if ((a[id] ?? 0) !== (b[id] ?? 0)) return true;
  return false;
};

/**
 * Look an edition code up on its platform and prepare the match for opening.
 *
 * Resolves false when there is no sheet behind the code — an invalid code, which
 * every entry point reports with `noSuchMatchMessage`. Otherwise the fetched
 * sheet is seeded so the game center opens prepopulated, and true is resolved.
 *
 * A sheet already held on this device is never silently discarded: with
 * `reconcile`, a local version whose score disagrees with the synced one lets
 * the user pick which to open with; without it, the local version is kept.
 */
export async function openMatch(
  platform: PlatformConfig,
  edition: string,
  { reconcile = false }: { reconcile?: boolean } = {},
): Promise<boolean> {
  const key = matchKey(platform.slug, edition);
  if (verified.has(key)) return true;

  const sheet = await fetchSheet(buildExportUrl(platform, edition));
  if (!sheet) return false;

  const local = peekSheet(key);
  if (!local) {
    seedSheet(key, sheet);
  } else if (reconcile) {
    const localScores = computeScores(local.events);
    const syncedScores = computeScores(sheet.events);
    const useSynced =
      !scoresDiffer(localScores, syncedScores) ||
      (await useConfirm().confirm(
        `Scores differ for this match — this device shows ${formatScore(local, localScores)}, ` +
          `the synced sheet shows ${formatScore(sheet, syncedScores)}. Which do you want to use?`,
        { confirmLabel: 'Use synced sheet', cancelLabel: 'Keep this device' },
      ));
    // Keeping this device's version: leave storage untouched, just open it.
    if (useSynced) seedSheet(key, sheet);
  }

  verified.add(key);
  return true;
}
