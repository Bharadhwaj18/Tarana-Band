// Defaults for the "As seen on stage at" strip on the About page.
// Used until the lists are edited in admin -> About page, and when a list was never saved.

// Big festivals first: shown in large letters
export const DEFAULT_HEADLINE_STAGES = [
  'Bengaluru Ganesh Utsava',
  'Udupi Paryaya',
  'Under 25 Summit',
  'Slaughterfest',
  'Bangalore Habba',
];

// Colleges and venues: shown in smaller type underneath
export const DEFAULT_MORE_STAGES = [
  'MAHE Bengaluru',
  'DSCE',
  'RNSIT',
  'SMVITM',
  'NITTE',
  'Orion Mall',
  'Phoenix Marketcity',
  'Forum South Mall',
];

/** One name per line, blank lines and extra spaces removed */
export function cleanStageList(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean);
}
