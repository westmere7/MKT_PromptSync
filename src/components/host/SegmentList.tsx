'use client'

import type { Segment } from '@/lib/types'

type Props = {
  segments: Segment[]
  activeIndex: number
  highlightColor: string
  onJump: (index: number) => void
  onToggleHighlight: (index: number) => void
}

export default function SegmentList({
  segments,
  activeIndex,
  highlightColor,
  onJump,
  onToggleHighlight,
}: Props) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Segments
      </h2>
      {segments.length === 0 ? (
        <p className="text-sm text-gray-500">No segments yet — load a script above.</p>
      ) : (
        <ul className="space-y-1.5">
          {segments.map((seg, i) => (
            <li
              key={seg.id ?? i}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
                i === activeIndex
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-800 bg-gray-950 hover:border-gray-600'
              }`}
            >
              <button
                onClick={() => onJump(i)}
                className="flex-1 truncate text-left text-sm"
                title="Jump prompter to this segment"
              >
                <span className={i === activeIndex ? 'text-cyan-300' : ''}>{seg.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {seg.text.split(/\s+/).length} words
                </span>
              </button>
              <button
                onClick={() => onToggleHighlight(i)}
                title="Toggle highlight on phone"
                className="rounded-md border px-2 py-0.5 text-xs transition"
                style={{
                  borderColor: seg.highlighted ? highlightColor : '#374151',
                  color: seg.highlighted ? highlightColor : '#6b7280',
                  background: seg.highlighted ? `${highlightColor}22` : 'transparent',
                }}
              >
                HL
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
