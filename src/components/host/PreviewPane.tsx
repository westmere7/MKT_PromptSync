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
  onMeasure: (offsetsEm: number[]) => void
  onActiveSegment: (index: number) => void
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  const device = display ?? FALLBACK
  const height = device.w > 0 ? width * (device.h / device.w) : 0

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
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-gray-700">
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
        The bright band is what the talent sees between the calibration bars. Text wraps exactly as
        on the phone.
      </p>
    </section>
  )
}
