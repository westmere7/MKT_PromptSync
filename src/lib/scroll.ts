import type { Playback } from './types'

/**
 * Compute the scroll position (in em) at a given server-clock time.
 * Every connected device runs this same function each animation frame,
 * so phone and desktop stay in sync without streaming positions.
 */
export function positionAt(playback: Playback, speedEmPerSec: number, nowMs: number): number {
  if (!playback.playing) return Math.max(0, playback.anchorEm)
  const elapsed = (nowMs - playback.anchorTime) / 1000
  return Math.max(0, playback.anchorEm + speedEmPerSec * elapsed)
}
