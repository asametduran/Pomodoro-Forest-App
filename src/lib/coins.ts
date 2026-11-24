/** One coin per full focused minute; only completed sessions earn coins. */
export function coinsForSession(plannedSeconds: number): number {
  return Math.max(0, Math.floor(plannedSeconds / 60));
}
