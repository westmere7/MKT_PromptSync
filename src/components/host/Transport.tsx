'use client'

import type { ReactNode } from 'react'
import {
  IconPause,
  IconPlay,
  IconRotateCcw,
  IconRotateCw,
  IconSkipEnd,
  IconSkipStart,
} from '@/components/icons'
import ScrubSlider from '@/components/host/ScrubSlider'
import type { Playback } from '@/lib/types'

type Props = {
  playing: boolean
  onPlayPause: () => void
  onToStart: () => void
  onToEnd: () => void
  onNudge: (seconds: number) => void
  // Scrub slider
  playback: Playback
  speed: number
  totalEm: number
  now: () => number
  onScrubTo: (posEm: number) => void
}

function Btn({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-gray-200 transition hover:border-gray-500"
    >
      {children}
    </button>
  )
}

export default function Transport({
  playing,
  onPlayPause,
  onToStart,
  onToEnd,
  onNudge,
  playback,
  speed,
  totalEm,
  now,
  onScrubTo,
}: Props) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-3 shadow-lg sm:p-4">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <Btn title="Back to start" onClick={onToStart}>
          <IconSkipStart />
        </Btn>
        <Btn title="Back 5 seconds" onClick={() => onNudge(-5)}>
          <IconRotateCcw size={18} />
          <span className="text-xs font-medium">5s</span>
        </Btn>
        <button
          onClick={onPlayPause}
          className={`flex min-w-24 items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold text-white transition sm:min-w-32 sm:px-6 ${
            playing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <Btn title="Forward 5 seconds" onClick={() => onNudge(5)}>
          <span className="text-xs font-medium">5s</span>
          <IconRotateCw size={18} />
        </Btn>
        <Btn title="Skip to end" onClick={onToEnd}>
          <IconSkipEnd />
        </Btn>
      </div>
      <ScrubSlider
        playback={playback}
        speed={speed}
        totalEm={totalEm}
        now={now}
        onScrubTo={onScrubTo}
      />
    </section>
  )
}
