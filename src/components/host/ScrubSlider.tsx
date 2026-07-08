'use client'

import { useEffect, useRef } from 'react'
import { positionAt } from '@/lib/scroll'
import type { Playback } from '@/lib/types'

type Props = {
  playback: Playback
  speed: number
  totalEm: number
  now: () => number
  onScrubTo: (posEm: number) => void
}

// Cap Firebase writes while dragging (~22/sec) — smooth without flooding.
const WRITE_THROTTLE_MS = 45

/**
 * A range slider spanning the whole script. The thumb follows the live scroll
 * position each frame; dragging it scrubs to an absolute position (paused).
 */
export default function ScrubSlider({ playback, speed, totalEm, now, onScrubTo }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const draggingRef = useRef(false)
  const lastWriteRef = useRef(0)
  const max = Math.max(totalEm, 0.001)

  // Follow the live position unless the user is actively dragging.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = ref.current
      if (el && !draggingRef.current) {
        el.value = String(Math.min(positionAt(playback, speed, now()), max))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playback, speed, now, max])

  const write = (v: number, force = false) => {
    const t = performance.now()
    if (force || t - lastWriteRef.current > WRITE_THROTTLE_MS) {
      lastWriteRef.current = t
      onScrubTo(v)
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Scrub</span>
      <input
        ref={ref}
        type="range"
        min={0}
        max={max}
        step="any"
        defaultValue={0}
        onPointerDown={() => (draggingRef.current = true)}
        onPointerUp={(e) => {
          draggingRef.current = false
          write(Number((e.target as HTMLInputElement).value), true)
        }}
        onChange={(e) => write(Number(e.target.value))}
        className="w-full"
        aria-label="Scrub through the script"
      />
    </div>
  )
}
