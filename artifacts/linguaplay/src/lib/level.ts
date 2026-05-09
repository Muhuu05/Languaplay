export const XP_PER_LEVEL = 100;

export type LevelInfo = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  progress: number;
};

export function computeLevel(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpInLevel = safeXp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const progress = xpInLevel / XP_PER_LEVEL;
  return { level, xpInLevel, xpToNext, progress };
}
