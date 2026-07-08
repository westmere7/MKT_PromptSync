'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { positionAt } from '@/lib/scroll'
import type { Calibration, Playback, Segment, Settings } from '@/lib/types'

type Props = {
  segments: Segment[]
  settings: Settings
  playback: Playback
  calibration: Calibration
  now: () => number
  /** Rendered size of this canvas in CSS px */
  width: number
  height: number
  /** Real width of the display phone in CSS px — text wraps identically at any scale */
  deviceWidth: number
  /** Apply the mirror flip (phone: follows settings; desktop preview: never) */
  applyMirror: boolean
  /** 1 = opaque mask outside the calibrated band (phone), <1 = dimmed (preview) */
  maskOpacity: number
  /** Reports each segment's scroll offset in em after layout (used for jumps) */
  onMeasure?: (offsetsEm: number[]) => void
  /** Reports which segment currently sits at the top of the band */
  onActiveSegment?: (index: number) => void
}

const SIDE_PADDING_FRACTION = 0.05

export default function PrompterCanvas({
  segments,
  settings,
  playback,
  calibration,
  now,
  width,
  height,
  deviceWidth,
  applyMirror,
  maskOpacity,
  onMeasure,
  onActiveSegment,
}: Props) {
  const textRef = useRef<HTMLDivElement>(null)
  const offsetsRef = useRef<number[]>([])
  const activeRef = useRef(-1)

  const scale = deviceWidth > 0 ? width / deviceWidth : 1
  const fontPx = settings.fontSize * scale
  const bandTop = calibration.top * height
  const bandBottom = calibration.bottom * height

  // Measure segment offsets (in em) whenever layout-affecting inputs change
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el || fontPx <= 0) return
    const offsets: number[] = []
    el.querySelectorAll<HTMLElement>('[data-segment]').forEach((child) => {
      offsets.push(child.offsetTop / fontPx)
    })
    offsetsRef.current = offsets
    onMeasure?.(offsets)
  }, [segments, fontPx, width, settings.lineHeight, settings.fontFamily, onMeasure])

  // Animation loop: everyone computes the same position from the shared playback anchor
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = textRef.current
      if (el) {
        const posEm = positionAt(playback, settings.speed, now())
        el.style.transform = `translateY(${bandTop - posEm * fontPx}px)`

        if (onActiveSegment) {
          const offsets = offsetsRef.current
          let active = -1
          for (let i = 0; i < offsets.length; i++) {
            if (offsets[i] <= posEm + 0.5) active = i
          }
          if (active !== activeRef.current) {
            activeRef.current = active
            onActiveSegment(active)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playback, settings.speed, now, bandTop, fontPx, onActiveSegment])

  const sidePad = width * SIDE_PADDING_FRACTION

  return (
    <div
      className="relative overflow-hidden bg-black"
      style={{
        width,
        height,
        transform: applyMirror && settings.mirror ? 'scaleX(-1)' : undefined,
      }}
    >
      <div
        ref={textRef}
        className="absolute top-0 will-change-transform"
        style={{
          left: sidePad,
          right: sidePad,
          fontSize: fontPx,
          lineHeight: settings.lineHeight,
          fontFamily: settings.fontFamily,
          color: '#ffffff',
        }}
      >
        {segments.map((seg, i) => (
          <div
            key={seg.id ?? i}
            data-segment={i}
            className="whitespace-pre-wrap"
            style={{
              marginBottom: '0.8em',
              color: seg.highlighted ? settings.highlightColor : undefined,
            }}
          >
            {seg.text}
          </div>
        ))}
      </div>

      {/* Mask outside the calibrated band */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: bandTop, background: `rgba(0,0,0,${maskOpacity})` }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: Math.max(0, height - bandBottom), background: `rgba(0,0,0,${maskOpacity})` }}
      />
      {maskOpacity < 1 && (
        <>
          <div className="absolute inset-x-0 border-t border-cyan-500/60" style={{ top: bandTop }} />
          <div className="absolute inset-x-0 border-t border-cyan-500/60" style={{ top: bandBottom }} />
        </>
      )}
    </div>
  )
}
