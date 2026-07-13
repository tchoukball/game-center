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
  /** Optional inline SVG markup for the platform's logo. */
  logoSvg?: string;
}

/** The token replaced by the edition code inside a platform's `exportUrl`. */
export const CODE_PLACEHOLDER = '{CODE}';

export const platforms: PlatformConfig[] = [
  {
    slug: 'tchouknet',
    name: 'Tchouk.net',
    exportUrl: 'https://data.tchouk.net/api/games/{CODE}/sheet',
    logoSvg: `<svg width="100%" height="100%" viewBox="0 0 935 213" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1,0,0,1,-332.808,-343.687)"><g transform="matrix(1,0,0,1,-158.446,20.9932)"><g transform="matrix(1,0,0,1,-668,91)"><path d="M1302.51,257.246L1349.31,233.849C1357.17,229.919 1366.66,231.46 1372.87,237.674C1379.09,243.888 1380.63,253.381 1376.7,261.241L1317.22,380.193C1315.1,384.437 1311.57,387.809 1307.23,389.73L1187.94,442.57C1179.98,446.094 1170.67,444.188 1164.73,437.821C1158.8,431.454 1157.56,422.027 1161.63,414.338L1183.12,373.819C1188.78,377.792 1194.95,381.091 1201.51,383.599C1191.49,402.506 1182.82,418.844 1180.6,423.034L1298.65,370.742L1357.51,253.042L1311.85,275.871C1309.5,269.247 1306.35,263 1302.51,257.246Z" style="fill:currentColor;"></path></g><g transform="matrix(1,0,0,1,-668,91)"><circle cx="1231.8" cy="304.25" r="64.083" style="fill:rgb(0,222,179);"></circle></g></g><g transform="matrix(1.20271,0,0,1.20271,-315.911,-93.1994)"><g transform="matrix(125.644,0,0,125.644,771,496)"><path d="M0.072,-0.507L0.021,-0.507L0.021,-0.429L0.072,-0.429L0.072,-0.125C0.072,-0.085 0.083,-0.054 0.107,-0.033C0.13,-0.011 0.159,-0 0.195,-0L0.248,-0L0.248,-0.096L0.21,-0.096C0.185,-0.096 0.173,-0.108 0.174,-0.134L0.174,-0.429L0.248,-0.429L0.248,-0.507L0.174,-0.507L0.174,-0.661L0.072,-0.661L0.072,-0.507Z" style="fill:currentColor;fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,805.908,496)"><path d="M0.364,-0.149C0.338,-0.114 0.304,-0.097 0.261,-0.096C0.174,-0.095 0.13,-0.147 0.129,-0.253C0.13,-0.36 0.174,-0.412 0.261,-0.411C0.304,-0.41 0.338,-0.392 0.364,-0.358L0.439,-0.425C0.417,-0.451 0.391,-0.473 0.361,-0.489C0.331,-0.504 0.296,-0.513 0.257,-0.513C0.197,-0.514 0.144,-0.494 0.099,-0.453C0.052,-0.412 0.028,-0.345 0.027,-0.253C0.028,-0.162 0.052,-0.096 0.099,-0.055C0.144,-0.014 0.197,0.006 0.257,0.006C0.296,0.005 0.331,-0.003 0.361,-0.02C0.391,-0.036 0.417,-0.057 0.439,-0.082L0.364,-0.149Z" style="fill:currentColor;fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,861.675,496)"><path d="M0.066,-0L0.168,-0L0.168,-0.302C0.168,-0.337 0.178,-0.364 0.197,-0.383C0.216,-0.402 0.24,-0.411 0.269,-0.411C0.298,-0.411 0.322,-0.402 0.341,-0.383C0.36,-0.364 0.369,-0.337 0.369,-0.302L0.369,-0L0.471,-0L0.471,-0.337C0.47,-0.395 0.451,-0.439 0.417,-0.469C0.382,-0.498 0.344,-0.513 0.302,-0.513C0.247,-0.513 0.203,-0.493 0.17,-0.453L0.168,-0.453L0.168,-0.712L0.066,-0.712L0.066,-0Z" style="fill:currentColor;fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,929.16,496)"><path d="M0.041,-0.254C0.041,-0.201 0.045,-0.16 0.054,-0.132C0.063,-0.104 0.077,-0.08 0.096,-0.059C0.11,-0.043 0.13,-0.029 0.155,-0.016C0.18,-0.002 0.211,0.005 0.25,0.006C0.29,0.005 0.322,-0.002 0.347,-0.016C0.361,-0.022 0.371,-0.029 0.38,-0.037C0.389,-0.044 0.397,-0.052 0.404,-0.059C0.424,-0.08 0.438,-0.104 0.447,-0.132C0.455,-0.16 0.459,-0.201 0.459,-0.254C0.459,-0.307 0.455,-0.348 0.447,-0.377C0.438,-0.405 0.424,-0.429 0.404,-0.448C0.39,-0.465 0.372,-0.48 0.347,-0.493C0.322,-0.506 0.29,-0.513 0.25,-0.513C0.211,-0.513 0.18,-0.506 0.155,-0.493C0.13,-0.48 0.11,-0.465 0.096,-0.448C0.077,-0.429 0.063,-0.405 0.054,-0.377C0.045,-0.348 0.041,-0.307 0.041,-0.254ZM0.357,-0.253C0.357,-0.218 0.355,-0.193 0.352,-0.177C0.349,-0.16 0.342,-0.146 0.332,-0.133C0.325,-0.123 0.313,-0.114 0.299,-0.107C0.285,-0.1 0.269,-0.096 0.25,-0.096C0.233,-0.096 0.217,-0.1 0.202,-0.107C0.188,-0.114 0.177,-0.123 0.168,-0.133C0.159,-0.146 0.153,-0.16 0.149,-0.177C0.145,-0.193 0.143,-0.219 0.143,-0.254C0.143,-0.289 0.145,-0.315 0.149,-0.332C0.153,-0.348 0.159,-0.362 0.168,-0.374C0.177,-0.385 0.188,-0.394 0.202,-0.401C0.217,-0.408 0.233,-0.411 0.25,-0.411C0.269,-0.411 0.285,-0.408 0.299,-0.401C0.313,-0.394 0.325,-0.385 0.332,-0.374C0.342,-0.362 0.349,-0.348 0.352,-0.332C0.355,-0.315 0.357,-0.289 0.357,-0.253Z" style="fill:currentColor;fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,991.982,496)"><path d="M0.066,-0.17C0.067,-0.113 0.085,-0.069 0.122,-0.04C0.156,-0.01 0.194,0.005 0.236,0.006C0.29,0.006 0.334,-0.014 0.367,-0.054L0.369,-0.054L0.369,-0L0.471,-0L0.471,-0.507L0.369,-0.507L0.369,-0.205C0.369,-0.171 0.36,-0.144 0.341,-0.125C0.322,-0.106 0.298,-0.096 0.269,-0.096C0.24,-0.096 0.216,-0.106 0.197,-0.125C0.178,-0.144 0.168,-0.171 0.168,-0.205L0.168,-0.507L0.066,-0.507L0.066,-0.17Z" style="fill:currentColor;fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,1059.47,496)"><path d="M0.066,-0L0.168,-0L0.168,-0.146L0.248,-0.237L0.383,-0L0.511,-0L0.312,-0.309L0.487,-0.507L0.365,-0.507L0.17,-0.269L0.168,-0.269L0.168,-0.712L0.066,-0.712L0.066,-0Z" style="fill:currentColor;fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,1124.68,496)"><rect x="0.069" y="-0.102" width="0.102" height="0.102" style="fill:rgb(0,222,179);fill-rule:nonzero;"></rect></g><g transform="matrix(125.644,0,0,125.644,1154.8,496)"><path d="M0.066,-0L0.168,-0L0.168,-0.302C0.168,-0.337 0.178,-0.364 0.197,-0.383C0.216,-0.402 0.24,-0.411 0.269,-0.411C0.298,-0.411 0.322,-0.402 0.341,-0.383C0.36,-0.364 0.369,-0.337 0.369,-0.302L0.369,-0L0.471,-0L0.471,-0.337C0.47,-0.395 0.451,-0.439 0.417,-0.469C0.382,-0.498 0.344,-0.513 0.302,-0.513C0.247,-0.513 0.203,-0.493 0.17,-0.453L0.168,-0.453L0.168,-0.507L0.066,-0.507L0.066,-0Z" style="fill:rgb(0,222,179);fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,1222.29,496)"><path d="M0.459,-0.215L0.459,-0.299C0.458,-0.366 0.438,-0.418 0.397,-0.456C0.357,-0.493 0.308,-0.513 0.25,-0.513C0.226,-0.513 0.201,-0.509 0.177,-0.5C0.152,-0.491 0.129,-0.477 0.109,-0.457C0.089,-0.438 0.073,-0.411 0.06,-0.377C0.047,-0.344 0.041,-0.302 0.041,-0.252C0.041,-0.2 0.048,-0.158 0.063,-0.125C0.076,-0.091 0.094,-0.065 0.115,-0.046C0.126,-0.037 0.138,-0.029 0.151,-0.023C0.163,-0.016 0.175,-0.01 0.188,-0.006C0.213,0.002 0.239,0.006 0.266,0.006C0.336,0.007 0.397,-0.021 0.449,-0.076L0.375,-0.139C0.342,-0.106 0.306,-0.09 0.264,-0.09C0.229,-0.09 0.2,-0.101 0.178,-0.122C0.155,-0.143 0.143,-0.174 0.143,-0.215L0.459,-0.215ZM0.143,-0.299C0.145,-0.338 0.156,-0.368 0.175,-0.388C0.194,-0.407 0.219,-0.417 0.25,-0.417C0.281,-0.417 0.306,-0.407 0.325,-0.388C0.345,-0.368 0.356,-0.338 0.357,-0.299L0.143,-0.299Z" style="fill:rgb(0,222,179);fill-rule:nonzero;"></path></g><g transform="matrix(125.644,0,0,125.644,1285.11,496)"><path d="M0.072,-0.507L0.021,-0.507L0.021,-0.429L0.072,-0.429L0.072,-0.125C0.072,-0.085 0.083,-0.054 0.107,-0.033C0.13,-0.011 0.159,-0 0.195,-0L0.248,-0L0.248,-0.096L0.21,-0.096C0.185,-0.096 0.173,-0.108 0.174,-0.134L0.174,-0.429L0.248,-0.429L0.248,-0.507L0.174,-0.507L0.174,-0.661L0.072,-0.661L0.072,-0.507Z" style="fill:rgb(0,222,179);fill-rule:nonzero;"></path></g></g></g></svg>`,
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
