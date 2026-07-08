'use client'

import { useEffect, useRef, useState } from 'react'
import { splitIntoPieces } from '@/lib/highlight'
import { IconChevronDown, IconChevronRight, IconHighlighter } from '@/components/icons'
import type { Highlight, Segment } from '@/lib/types'

type Props = {
  segments: Segment[]
  activeIndex: number
  highlightColor: string
  onJump: (index: number) => void
  onToggleHighlight: (index: number) => void
  onAddHighlight: (index: number, range: Highlight) => void
  onRemoveHighlight: (index: number, range: Highlight) => void
  onClearHighlights: (index: number) => void
}

export default function SegmentList({
  segments,
  activeIndex,
  highlightColor,
  onJump,
  onToggleHighlight,
  onAddHighlight,
  onRemoveHighlight,
  onClearHighlights,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Segments</h2>
      <p className="mb-3 text-xs text-gray-500">
        Tap a name to jump the prompter there. Expand a segment, select any text, then tap{' '}
        <strong>Highlight selected text</strong>. Tap a highlight to remove it.
      </p>
      {segments.length === 0 ? (
        <p className="text-sm text-gray-500">No segments yet — load a script above.</p>
      ) : (
        <ul className="space-y-1.5">
          {segments.map((seg, i) => {
            const isOpen = expanded === i
            const hlCount = seg.highlights?.length ?? 0
            return (
              <li
                key={seg.id ?? i}
                className={`rounded-lg border transition ${
                  i === activeIndex
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-800 bg-gray-950'
                }`}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="px-3 py-3 text-gray-500 hover:text-gray-300"
                    title={isOpen ? 'Collapse' : 'Expand to highlight text'}
                    aria-label={isOpen ? 'Collapse' : 'Expand to highlight text'}
                  >
                    {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                  </button>
                  <button
                    onClick={() => onJump(i)}
                    className="flex-1 truncate py-3 text-left text-sm"
                    title="Jump prompter to this segment"
                  >
                    <span className={i === activeIndex ? 'text-cyan-300' : ''}>{seg.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {seg.text.split(/\s+/).filter(Boolean).length} words
                      {hlCount > 0 && ` · ${hlCount} hl`}
                    </span>
                  </button>
                  <button
                    onClick={() => onToggleHighlight(i)}
                    title="Highlight the whole segment"
                    className="mr-2 rounded-md border px-3 py-1.5 text-xs transition"
                    style={{
                      borderColor: seg.highlighted ? highlightColor : '#374151',
                      color: seg.highlighted ? highlightColor : '#6b7280',
                      background: seg.highlighted ? `${highlightColor}22` : 'transparent',
                    }}
                  >
                    All
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-800 px-3 py-3">
                    {seg.highlighted ? (
                      <p className="text-xs text-gray-500">
                        Whole segment is highlighted (the <strong>All</strong> button). Turn it off
                        to highlight individual phrases.
                      </p>
                    ) : (
                      <HighlightableText
                        segment={seg}
                        highlightColor={highlightColor}
                        onAdd={(range) => onAddHighlight(i, range)}
                        onRemove={(range) => onRemoveHighlight(i, range)}
                      />
                    )}
                    {hlCount > 0 && !seg.highlighted && (
                      <button
                        onClick={() => onClearHighlights(i)}
                        className="mt-2 py-1 text-xs text-red-400 hover:text-red-300"
                      >
                        Clear all highlights in this segment
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function HighlightableText({
  segment,
  highlightColor,
  onAdd,
  onRemove,
}: {
  segment: Segment
  highlightColor: string
  onAdd: (range: Highlight) => void
  onRemove: (range: Highlight) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<Highlight | null>(null)
  const [hasPending, setHasPending] = useState(false)
  const pieces = splitIntoPieces(segment.text, segment.highlights)

  // Track the current text selection (works for mouse drag and touch long-press).
  // We keep the last valid selection until it is applied — tapping the Apply
  // button collapses the selection, so we must not clear on collapse.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resolveOffset = (node: Node | null, offset: number): number | null => {
      if (!node) return null
      let el: HTMLElement | null =
        node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
      while (el && el !== container && el.dataset.start === undefined) el = el.parentElement
      if (!el || el.dataset.start === undefined) return null
      return Number(el.dataset.start) + offset
    }

    const onSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) return
      if (!container.contains(sel.anchorNode) || !container.contains(sel.focusNode)) return
      const a = resolveOffset(sel.anchorNode, sel.anchorOffset)
      const b = resolveOffset(sel.focusNode, sel.focusOffset)
      if (a === null || b === null || a === b) return
      pendingRef.current = { start: Math.min(a, b), end: Math.max(a, b) }
      setHasPending(true)
    }

    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  const apply = () => {
    if (!pendingRef.current) return
    onAdd(pendingRef.current)
    pendingRef.current = null
    setHasPending(false)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="max-h-48 select-text overflow-auto whitespace-pre-wrap rounded-md border border-gray-800 bg-black p-3 text-sm leading-relaxed text-gray-200"
      >
        {pieces.map((piece, pi) =>
          piece.highlighted ? (
            <span
              key={pi}
              data-start={piece.start}
              onClick={() => onRemove({ start: piece.start, end: piece.start + piece.text.length })}
              title="Tap to remove this highlight"
              className="cursor-pointer rounded-sm"
              style={{ color: highlightColor, background: `${highlightColor}22` }}
            >
              {piece.text}
            </span>
          ) : (
            <span key={pi} data-start={piece.start}>
              {piece.text}
            </span>
          )
        )}
      </div>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={apply}
        disabled={!hasPending}
        className="mt-2 flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-2 text-xs font-medium text-white transition enabled:hover:bg-cyan-500 disabled:opacity-40"
      >
        <IconHighlighter size={15} />
        Highlight selected text
      </button>
    </div>
  )
}
