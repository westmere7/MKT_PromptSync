import type { Markers, Playback } from './types'

/**
 * Compute the scroll position (in em) at a given server-clock time, clamped to
 * the [lo, hi] bounds. Every connected device runs this same function each
 * animation frame, so phone and desktop stay in sync — and all of them stop at
 * the same in/out markers — without streaming positions.
 */
export function positionAt(
  playback: Playback,
  speedEmPerSec: number,
  nowMs: number,
  lo = 0,
  hi = Infinity
): number {
  const raw = playback.playing
    ? playback.anchorEm + speedEmPerSec * ((nowMs - playback.anchorTime) / 1000)
    : playback.anchorEm
  return Math.min(hi, Math.max(lo, raw))
}

/**
 * Resolve the in/out markers into concrete [lo, hi] em bounds given the current
 * content length. A null `outEm` (or no markers) means "to the end".
 */
export function resolveBounds(
  markers: Markers | undefined,
  totalEm: number
): { lo: number; hi: number } {
  const total = Math.max(0, totalEm)
  const lo = Math.min(Math.max(0, markers?.inEm ?? 0), total)
  const rawHi = markers?.outEm == null ? total : Math.min(markers.outEm, total)
  return { lo, hi: Math.max(lo, rawHi) }
}
