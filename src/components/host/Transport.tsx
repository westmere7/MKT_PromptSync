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
      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-700 bg-gray-800 py-4 text-gray-200 transition hover:border-gray-500 lg:flex-none lg:px-3 lg:py-3"
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
    <section className="border-t border-gray-700 bg-gray-950/95 px-3 pb-4 pt-3 shadow-[0_-8px_28px_rgba(0,0,0,0.6)] backdrop-blur lg:rounded-xl lg:border lg:border-gray-800 lg:bg-gray-900 lg:p-4 lg:pt-4 lg:shadow-lg">
      <div className="flex items-stretch justify-center gap-2">
        <Btn title="Back to start" onClick={onToStart}>
          <IconSkipStart size={22} />
        </Btn>
        <Btn title="Back 5 seconds" onClick={() => onNudge(-5)}>
          <IconRotateCcw size={20} />
          <span className="text-sm font-medium lg:text-xs">5s</span>
        </Btn>
        <button
          onClick={onPlayPause}
          className={`flex flex-[1.6] items-center justify-center gap-2 rounded-lg py-4 text-lg font-semibold text-white transition lg:min-w-32 lg:flex-none lg:px-6 lg:py-3 lg:text-base ${
            playing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <Btn title="Forward 5 seconds" onClick={() => onNudge(5)}>
          <span className="text-sm font-medium lg:text-xs">5s</span>
          <IconRotateCw size={20} />
        </Btn>
        <Btn title="Skip to end" onClick={onToEnd}>
          <IconSkipEnd size={22} />
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
