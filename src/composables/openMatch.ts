import { buildExportUrl } from '../config/platforms';
import type { PlatformConfig } from '../config/platforms';
import { fetchSheet } from './useSheetSync';
import { matchKey, peekSheet, seedSheet } from '../stores/useMatchStore';
import { useConfirm } from './useConfirm';
import { computeScores, scoresByPeriod } from '../types';
import type { GameSheet, TchoukScoresType } from '../types';

/** What the user is told when a code has no match behind it, wherever they entered it. */
export const noSuchMatchMessage = (edition: string) =>
  `Edition code “${edition}” doesn’t match an existing match. Check it and try again.`;

// Codes confirmed to exist this session, so entering a match through the code
// form and then landing on its game center only costs one round trip.
const verified = new Set<string>();

// A version of the sheet, laid out like the scoresheet it is: the total first,
// then a column per period, and a row per team in the order the teams are named
// in the question. Reading down a column shows where the versions parted ways.
//
//   TOTAL  P1  P2  P3
//      10   2   8   0
//      12   3   7   2
const versionTable = (sheet: GameSheet, scores: TchoukScoresType): string[][] => {
  const periods = scoresByPeriod(sheet.events);
  return [
    ['Total', ...periods.map((_, i) => `P${i + 1}`)],
    ...sheet.teams.map((team) => [
      String(scores[team.id] ?? 0),
      ...periods.map((period) => String(period[team.id] ?? 0)),
    ]),
  ];
};

// Total points on the sheet, both teams together — the version with more of
// them has recorded the most, so it is the one to point the user at.
const totalPoints = (scores: TchoukScoresType) =>
  Object.values(scores).reduce((sum, n) => sum + n, 0);

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
 * A sheet already held on this device is never silently discarded: when its
 * score disagrees with the synced one, one of the two is stale and the user
 * picks which to open with. This holds however the match was reached — typing
 * the code, scanning it, or landing on the match URL directly.
 */
export async function openMatch(
  platform: PlatformConfig,
  edition: string,
): Promise<boolean> {
  const key = matchKey(platform.slug, edition);
  if (verified.has(key)) return true;

  const sheet = await fetchSheet(buildExportUrl(platform, edition));
  if (!sheet) return false;

  const local = peekSheet(key);
  if (!local) {
    seedSheet(key, sheet);
  } else {
    const localScores = computeScores(local.events);
    const syncedScores = computeScores(sheet.events);
    const useSynced =
      !scoresDiffer(localScores, syncedScores) ||
      (await useConfirm().confirm(
        `${sheet.teams.map((t) => t.name).join(' vs ')} — this device and the synced sheet ` +
          'disagree on the score. Which one do you want to keep?',
        {
          confirmLabel: 'Synced sheet',
          confirmTable: versionTable(sheet, syncedScores),
          cancelLabel: 'This device',
          cancelTable: versionTable(local, localScores),
          // Neither is knowably right, so point at the fuller one rather than
          // at whichever button happens to be the default.
          highlight:
            totalPoints(syncedScores) > totalPoints(localScores)
              ? 'confirm'
              : totalPoints(localScores) > totalPoints(syncedScores)
                ? 'cancel'
                : undefined,
        },
      ));
    // Keeping this device's version: leave storage untouched, just open it.
    if (useSynced) seedSheet(key, sheet);
  }

  verified.add(key);
  return true;
}
