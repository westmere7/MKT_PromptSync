'use client'

import { useEffect, useRef } from 'react'
import { positionAt, resolveBounds } from '@/lib/scroll'
import type { Markers, Playback } from '@/lib/types'

type Props = {
  playback: Playback
  speed: number
  totalEm: number
  markers: Markers
  now: () => number
  onScrubTo: (posEm: number) => void
  onSetMarkers: (next: Partial<Markers>) => void
}

// Cap Firebase writes while dragging (~22/sec) — smooth without flooding.
const WRITE_THROTTLE_MS = 45

type Drag = 'scrub' | 'in' | 'out'

/**
 * Scrub slider spanning the whole script, with draggable IN and OUT markers.
 * The scrub thumb follows the live position each frame and can only move within
 * [in, out]; the markers themselves can be dragged (or set to the playhead) to
 * bound where the prompter is allowed to scroll.
 */
export default function ScrubSlider({
  playback,
  speed,
  totalEm,
  markers,
  now,
  onScrubTo,
  onSetMarkers,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<Drag | null>(null)
  const lastWriteRef = useRef(0)

  const total = Math.max(totalEm, 0.001)
  const { lo, hi } = resolveBounds(markers, total)
  const pct = (em: number) => (Math.min(Math.max(em, 0), total) / total) * 100

  // Follow the live position each frame unless the scrub thumb is being dragged.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (draggingRef.current !== 'scrub' && thumbRef.current && fillRef.current) {
        const p = `${pct(positionAt(playback, speed, now(), lo, hi))}%`
        thumbRef.current.style.left = p
        fillRef.current.style.width = p
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback, speed, now, lo, hi, total])

  const emFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return frac * total
  }

  const throttled = (fn: () => void, force = false) => {
    const t = performance.now()
    if (force || t - lastWriteRef.current > WRITE_THROTTLE_MS) {
      lastWriteRef.current = t
      fn()
    }
  }

  // Reflect a scrub position immediately (before the RTDB round-trip lands).
  const paintScrub = (em: number) => {
    const p = `${pct(em)}%`
    if (thumbRef.current) thumbRef.current.style.left = p
    if (fillRef.current) fillRef.current.style.width = p
  }

  const apply = (drag: Drag, clientX: number, force = false) => {
    const em = emFromClientX(clientX)
    if (drag === 'scrub') {
      const clamped = Math.min(hi, Math.max(lo, em))
      paintScrub(clamped)
      throttled(() => onScrubTo(clamped), force)
    } else if (drag === 'in') {
      const clamped = Math.max(0, Math.min(em, hi))
      throttled(() => onSetMarkers({ inEm: clamped }), force)
    } else {
      const clamped = Math.min(total, Math.max(em, lo))
      throttled(() => onSetMarkers({ outEm: clamped }), force)
    }
  }

  // Handles capture the pointer on the track so all moves route back here.
  const startHandle = (drag: Drag) => (e: React.PointerEvent) => {
    e.stopPropagation()
    draggingRef.current = drag
    trackRef.current?.setPointerCapture(e.pointerId)
  }

  const onTrackPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = 'scrub'
    trackRef.current?.setPointerCapture(e.pointerId)
    apply('scrub', e.clientX, true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingRef.current) apply(draggingRef.current, e.clientX)
  }

  const endDrag = (e: React.PointerEvent) => {
    const drag = draggingRef.current
    if (!drag) return
    draggingRef.current = null
    apply(drag, e.clientX, true)
  }

  const playhead = () => positionAt(playback, speed, now(), 0, total)
  const setInHere = () => onSetMarkers({ inEm: Math.max(0, Math.min(playhead(), hi)) })
  const setOutHere = () => onSetMarkers({ outEm: Math.min(total, Math.max(playhead(), lo)) })
  const reset = () => onSetMarkers({ inEm: 0, outEm: null })

  const markersActive = lo > 0 || markers.outEm != null

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Scrub</span>
        <div className="flex items-center gap-1.5">
          <MarkerButton onClick={setInHere}>Set In</MarkerButton>
          <MarkerButton onClick={setOutHere}>Set Out</MarkerButton>
          <MarkerButton onClick={reset} disabled={!markersActive}>
            Reset
          </MarkerButton>
        </div>
      </div>

      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-9 touch-none select-none"
        aria-label="Scrub through the script"
      >
        {/* base track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-700" />
        {/* dimmed regions outside the in/out range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-l-full bg-gray-900/80"
          style={{ left: 0, width: `${pct(lo)}%` }}
        />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-r-full bg-gray-900/80"
          style={{ left: `${pct(hi)}%`, right: 0 }}
        />
        {/* played portion */}
        <div
          ref={fillRef}
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cyan-600/40"
          style={{ width: 0 }}
        />

        {/* IN marker (flag above the track) */}
        <Handle
          side="in"
          leftPct={pct(lo)}
          onPointerDown={startHandle('in')}
          label={`In marker at ${Math.round(pct(lo))}%`}
        />
        {/* OUT marker (flag below the track) */}
        <Handle
          side="out"
          leftPct={pct(hi)}
          onPointerDown={startHandle('out')}
          label={`Out marker at ${Math.round(pct(hi))}%`}
        />

        {/* scrub thumb */}
        <div
          ref={thumbRef}
          onPointerDown={startHandle('scrub')}
          className="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-900 bg-cyan-400 shadow"
          style={{ left: 0 }}
        />
      </div>
    </div>
  )
}

function MarkerButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-300 transition hover:border-amber-500 hover:text-amber-300 disabled:opacity-40 disabled:hover:border-gray-700 disabled:hover:text-gray-300"
    >
      {children}
    </button>
  )
}

function Handle({
  side,
  leftPct,
  onPointerDown,
  label,
}: {
  side: 'in' | 'out'
  leftPct: number
  onPointerDown: (e: React.PointerEvent) => void
  label: string
}) {
  const isIn = side === 'in'
  return (
    <div
      onPointerDown={onPointerDown}
      role="slider"
      aria-label={label}
      className={`absolute z-10 flex w-4 -translate-x-1/2 cursor-ew-resize flex-col items-center ${
        isIn ? 'top-0' : 'bottom-0'
      }`}
      style={{ left: `${leftPct}%` }}
    >
      {!isIn && <div className="h-4 w-0.5 bg-amber-400" />}
      <div className="rounded-sm bg-amber-400 px-1 text-[8px] font-bold leading-tight text-black">
        {isIn ? 'IN' : 'OUT'}
      </div>
      {isIn && <div className="h-4 w-0.5 bg-amber-400" />}
    </div>
  )
}
