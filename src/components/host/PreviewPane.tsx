'use client'

import { useEffect, useRef, useState } from 'react'
import PrompterCanvas from '@/components/PrompterCanvas'
import type { Calibration, DisplayInfo, Playback, Segment, Settings } from '@/lib/types'

type Props = {
  segments: Segment[]
  settings: Settings
  playback: Playback
  calibration: Calibration
  display: DisplayInfo | null
  now: () => number
  onMeasure: (offsetsEm: number[], totalEm: number) => void
  onActiveSegment: (index: number) => void
  /** Manual scrubbing in em (positive = forward). Wheel + touch/mouse drag. */
  onScrub: (deltaEm: number) => void
}

// Fallback phone viewport (landscape) when no display has joined yet
const FALLBACK = { w: 844, h: 390 }

export default function PreviewPane({
  segments,
  settings,
  playback,
  calibration,
  display,
  now,
  onMeasure,
  onActiveSegment,
  onScrub,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const draggingRef = useRef(false)
  const lastYRef = useRef(0)

  const device = display ?? FALLBACK
  const scale = device.w > 0 && width > 0 ? width / device.w : 1
  const fontPxPreview = settings.fontSize * scale
  const height = device.w > 0 ? width * (device.h / device.w) : 0

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  // Wheel needs a non-passive listener to be able to preventDefault (so the
  // page doesn't scroll while scrubbing the prompter).
  useEffect(() => {
    const el = containerRef.current
    if (!el || fontPxPreview <= 0) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      onScrub(e.deltaY / fontPxPreview)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [fontPxPreview, onScrub])

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    lastYRef.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || fontPxPreview <= 0) return
    const dy = e.clientY - lastYRef.current
    lastYRef.current = e.clientY
    // Drag up (dy < 0) advances the script forward.
    onScrub(-dy / fontPxPreview)
  }
  const endDrag = () => {
    draggingRef.current = false
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Phone preview
        </h2>
        <span className="text-xs text-gray-500">
          {display
            ? `${device.w}×${device.h} (live)`
            : `${FALLBACK.w}×${FALLBACK.h} (no display connected)`}
        </span>
      </div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="w-full touch-none cursor-grab overflow-hidden rounded-lg border border-gray-700 active:cursor-grabbing"
      >
        {width > 0 && height > 0 && (
          <PrompterCanvas
            segments={segments}
            settings={settings}
            playback={playback}
            calibration={calibration}
            now={now}
            width={width}
            height={height}
            deviceWidth={device.w}
            applyMirror={false}
            maskOpacity={0.82}
            onMeasure={onMeasure}
            onActiveSegment={onActiveSegment}
          />
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Drag or scroll here to scrub the prompter. The bright band is what the talent sees; text
        wraps exactly as on the phone.
      </p>
    </section>
  )
}
