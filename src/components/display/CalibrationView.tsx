'use client'

import { useEffect, useRef, useState } from 'react'
import { ref, update } from 'firebase/database'
import { getDb } from '@/lib/firebase'
import { sessionPath } from '@/lib/session'
import type { Calibration, Settings } from '@/lib/types'

type Props = {
  code: string
  calibration: Calibration
  settings: Settings
  sampleText: string
}

const MIN_GAP = 0.12
const LIVE_WRITE_INTERVAL_MS = 150

export default function CalibrationView({ code, calibration, settings, sampleText }: Props) {
  const [top, setTop] = useState(calibration.top)
  const [bottom, setBottom] = useState(calibration.bottom)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'top' | 'bottom' | null>(null)
  const lastWrite = useRef(0)
  const [viewportH, setViewportH] = useState(0)

  useEffect(() => {
    const measure = () => setViewportH(window.innerHeight)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const writeCalibration = (t: number, b: number) =>
    update(ref(getDb(), sessionPath(code)), { 'calibration/top': t, 'calibration/bottom': b })

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    let t = top
    let b = bottom
    if (dragging.current === 'top') t = Math.min(frac, bottom - MIN_GAP)
    else b = Math.max(frac, top + MIN_GAP)
    setTop(t)
    setBottom(b)
    // Live-sync while dragging (throttled) so the desktop preview follows
    const nowTs = performance.now()
    if (nowTs - lastWrite.current > LIVE_WRITE_INTERVAL_MS) {
      lastWrite.current = nowTs
      writeCalibration(t, b)
    }
  }

  const endDrag = () => {
    if (!dragging.current) return
    dragging.current = null
    writeCalibration(top, bottom)
  }

  const save = async () => {
    await update(ref(getDb(), sessionPath(code)), {
      'calibration/top': top,
      'calibration/bottom': bottom,
      mode: 'prompt',
    })
  }

  const topPx = top * viewportH
  const bottomPx = bottom * viewportH

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 touch-none select-none overflow-hidden bg-black"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Sample text between the bars, at real prompter settings */}
      <div
        className="absolute inset-x-0 overflow-hidden px-[5vw]"
        style={{ top: topPx, height: Math.max(0, bottomPx - topPx) }}
      >
        <div
          className="whitespace-pre-wrap text-white"
          style={{
            fontSize: settings.fontSize,
            lineHeight: settings.lineHeight,
            fontFamily: settings.fontFamily,
          }}
        >
          {sampleText}
        </div>
      </div>

      {/* Dimmed areas outside the band */}
      <div className="absolute inset-x-0 top-0 bg-neutral-900/90" style={{ height: topPx }} />
      <div
        className="absolute inset-x-0 bottom-0 bg-neutral-900/90"
        style={{ height: Math.max(0, viewportH - bottomPx) }}
      />

      {/* Draggable bars — generous touch targets */}
      <DragBar
        label="TOP — drag to the upper edge of the mirror view"
        y={topPx}
        onGrab={() => (dragging.current = 'top')}
      />
      <DragBar
        label="BOTTOM — drag to the lower edge of the mirror view"
        y={bottomPx}
        onGrab={() => (dragging.current = 'bottom')}
      />

      <div className="absolute inset-x-0 top-2 text-center text-xs text-gray-400">
        Calibration — frame exactly what is visible through the teleprompter mirror
      </div>

      <button
        onClick={save}
        className="absolute bottom-4 right-4 rounded-xl bg-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition active:bg-cyan-500"
      >
        ✓ Save calibration
      </button>
    </div>
  )
}

function DragBar({ label, y, onGrab }: { label: string; y: number; onGrab: () => void }) {
  return (
    <div
      className="absolute inset-x-0 z-10 -translate-y-1/2 cursor-ns-resize"
      style={{ top: y, height: 56 }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onGrab()
      }}
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-cyan-400" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-bold text-black">
        ⇕ {label}
      </div>
    </div>
  )
}
