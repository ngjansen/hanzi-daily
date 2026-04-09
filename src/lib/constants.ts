export const LAUNCH_DATE = new Date('2026-04-09');

export function getDaysSinceStart(date: Date): number {
  const start = new Date(LAUNCH_DATE);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
