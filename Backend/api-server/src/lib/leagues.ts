export const LEAGUES = [
  "bronze",
  "silver",
  "gold",
  "sapphire",
  "ruby",
  "diamond",
] as const;

export type League = (typeof LEAGUES)[number];

export function isLeague(value: string): value is League {
  return (LEAGUES as readonly string[]).includes(value);
}
