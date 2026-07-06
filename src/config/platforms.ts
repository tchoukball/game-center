// Configuration for the external platforms a match can be exported to.
//
// Add a platform by dropping another entry in `platforms`. Each entry needs a
// `slug` (used in the URL and as the display-name fallback) and an `exportUrl`.
// The `exportUrl` must contain the `{CODE}` placeholder, which is replaced with
// the edition code when the export URL is built (see `buildExportUrl`).

export interface PlatformConfig {
  /** URL-safe identifier; also the display name when `name` is absent. */
  slug: string;
  /** Human-friendly name. Falls back to `slug` when omitted. */
  name?: string;
  /** Export endpoint containing the `{CODE}` placeholder for the edition code. */
  exportUrl: string;
}

/** The token replaced by the edition code inside a platform's `exportUrl`. */
export const CODE_PLACEHOLDER = '{CODE}';

export const platforms: PlatformConfig[] = [
  {
    slug: 'tchouknet',
    name: 'Tchouk.net',
    exportUrl: 'https://data.tchouk.net/api/sheets/{CODE}/import',
  },
    /*
  {
    slug: 'swisstchoukball',
    name: 'Swiss Tchoukball',
    exportUrl: 'https://api.tchoukball.ch/matches/{CODE}/export',
  },
  {
    slug: 'ftbeurope',
    name: 'FTB Europe',
    exportUrl: 'https://europe.tchoukball.org/api/games/{CODE}/sheet',
  },
  {
    slug: 'local',
    name: 'Local / Test',
    exportUrl: 'http://localhost:8080/matches/{CODE}',
  },
     */
];

/** Display name for a platform: its `name`, or the `slug` as a fallback. */
export const platformName = (platform: PlatformConfig): string =>
  platform.name ?? platform.slug;

/** Look up a platform by slug, or `undefined` when it is not configured. */
export const findPlatform = (slug: string): PlatformConfig | undefined =>
  platforms.find((platform) => platform.slug === slug);

/**
 * Build the concrete export URL for a match by substituting every `{CODE}`
 * placeholder with the (URL-encoded) edition code.
 */
export const buildExportUrl = (
  platform: PlatformConfig,
  editionCode: string,
): string =>
  platform.exportUrl.split(CODE_PLACEHOLDER).join(encodeURIComponent(editionCode));
