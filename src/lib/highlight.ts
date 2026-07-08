import type { Highlight } from './types'

/**
 * Clamp ranges into [0, textLen), drop empties, sort, and merge overlaps.
 * After this, each range maps 1:1 to a highlighted piece — which is what lets
 * the host remove a highlight by clicking exactly one rendered span.
 */
export function normalizeHighlights(
  highlights: Highlight[] | undefined,
  textLen: number
): Highlight[] {
  if (!highlights || highlights.length === 0) return []
  const clean = highlights
    .map((h) => ({
      start: Math.max(0, Math.min(h.start, h.end)),
      end: Math.min(textLen, Math.max(h.start, h.end)),
    }))
    .filter((h) => h.end > h.start)
    .sort((a, b) => a.start - b.start)

  const merged: Highlight[] = []
  for (const h of clean) {
    const last = merged[merged.length - 1]
    if (last && h.start <= last.end) last.end = Math.max(last.end, h.end)
    else merged.push({ ...h })
  }
  return merged
}

export type Piece = { text: string; start: number; highlighted: boolean }

/** Split a segment's text into alternating plain / highlighted pieces. */
export function splitIntoPieces(text: string, highlights: Highlight[] | undefined): Piece[] {
  const norm = normalizeHighlights(highlights, text.length)
  if (norm.length === 0) return [{ text, start: 0, highlighted: false }]

  const pieces: Piece[] = []
  let cursor = 0
  for (const h of norm) {
    if (h.start > cursor) {
      pieces.push({ text: text.slice(cursor, h.start), start: cursor, highlighted: false })
    }
    pieces.push({ text: text.slice(h.start, h.end), start: h.start, highlighted: true })
    cursor = h.end
  }
  if (cursor < text.length) {
    pieces.push({ text: text.slice(cursor), start: cursor, highlighted: false })
  }
  return pieces
}

/** Add a range and re-normalize. */
export function addHighlight(
  existing: Highlight[] | undefined,
  range: Highlight,
  textLen: number
): Highlight[] {
  return normalizeHighlights([...(existing ?? []), range], textLen)
}

/** Remove any normalized range that exactly matches the given one. */
export function removeHighlight(
  existing: Highlight[] | undefined,
  range: Highlight,
  textLen: number
): Highlight[] {
  return normalizeHighlights(existing, textLen).filter(
    (h) => !(h.start === range.start && h.end === range.end)
  )
}
