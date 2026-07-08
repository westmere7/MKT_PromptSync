'use client'

import { Suspense, useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ref, update } from 'firebase/database'
import { getDb, isFirebaseConfigured } from '@/lib/firebase'
import { createSession, isValidCode, parseScript, sessionPath } from '@/lib/session'
import { positionAt } from '@/lib/scroll'
import { addHighlight, removeHighlight } from '@/lib/highlight'
import { useSessionData } from '@/hooks/useSessionData'
import { useServerNow } from '@/hooks/useServerNow'
import type { Highlight, Settings } from '@/lib/types'
import ScriptPanel from '@/components/host/ScriptPanel'
import SegmentList from '@/components/host/SegmentList'
import SettingsPanel from '@/components/host/SettingsPanel'
import Transport from '@/components/host/Transport'
import PreviewPane from '@/components/host/PreviewPane'
import QRConnect from '@/components/host/QRConnect'
import Logo from '@/components/Logo'
import { IconCheck, IconCopy, IconCrosshair, IconPlus, IconStop } from '@/components/icons'

export default function HostPage() {
  return (
    <Suspense>
      <HostInner />
    </Suspense>
  )
}

function HostInner() {
  const params = useSearchParams()
  const rawCode = (params.get('code') ?? '').toUpperCase()
  const code = isValidCode(rawCode) ? rawCode : null

  if (!code) return <NewSessionScreen />
  return <ControlRoom code={code} />
}

function NewSessionScreen() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const startNew = async () => {
    setBusy(true)
    setError('')
    try {
      const code = await createSession()
      router.replace(`/host?code=${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <Logo className="h-9 w-auto" />
      <h1 className="text-xl font-semibold text-gray-300">Host a session</h1>

      {!isFirebaseConfigured() && (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          Firebase is not configured — set up <code>.env.local</code> first (see README).
        </p>
      )}

      <button
        onClick={startNew}
        disabled={busy || !isFirebaseConfigured()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-4 text-lg font-semibold text-white transition enabled:hover:bg-cyan-500 disabled:opacity-40"
      >
        {busy ? 'Creating…' : (<><IconPlus size={20} /> New session</>)}
      </button>

      <div className="flex w-full items-center gap-3 text-xs text-gray-600">
        <div className="h-px flex-1 bg-gray-800" />
        or co-host an existing one
        <div className="h-px flex-1 bg-gray-800" />
      </div>

      <div className="flex w-full gap-2">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          maxLength={4}
          placeholder="CODE"
          className="w-32 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-center font-mono text-xl tracking-widest focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={() => isValidCode(joinCode) && router.push(`/host?code=${joinCode}`)}
          disabled={!isValidCode(joinCode)}
          className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-6 py-3 font-semibold transition enabled:hover:border-cyan-500 disabled:opacity-40"
        >
          Open session
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  )
}

function ControlRoom({ code }: { code: string }) {
  const session = useSessionData(code)
  const now = useServerNow()
  const segmentOffsetsRef = useRef<number[]>([])
  const totalEmRef = useRef(0)
  const [activeSegment, setActiveSegment] = useState(-1)
  const [copied, setCopied] = useState(false)

  const base = sessionPath(code)
  const patch = useCallback(
    (values: Record<string, unknown>) => update(ref(getDb(), base), values),
    [base]
  )

  const onMeasure = useCallback((offsets: number[], totalEm: number) => {
    segmentOffsetsRef.current = offsets
    totalEmRef.current = totalEm
  }, [])
  const onActiveSegment = useCallback((i: number) => setActiveSegment(i), [])

  if (session === undefined) {
    return <CenterMessage>Loading session {code}…</CenterMessage>
  }
  if (session === null) {
    return (
      <CenterMessage>
        Session <span className="font-mono text-cyan-400">{code}</span> was not found. Check the
        code, or start a new session.
        <a href="/host" className="mt-4 block text-cyan-400 underline">
          Start a new session
        </a>
      </CenterMessage>
    )
  }

  const { settings, playback, calibration, mode } = session
  const segments = session.segments ?? []
  const displays = session.displays ?? {}
  const displayList = Object.values(displays)
  const connected = displayList.length > 0

  // --- control actions ------------------------------------------------------

  const currentPos = () => positionAt(playback, settings.speed, now())

  const playPause = () => {
    const t = now()
    patch({
      'playback/playing': !playback.playing,
      'playback/anchorEm': currentPos(),
      'playback/anchorTime': t,
    })
  }

  const toStart = () =>
    patch({ 'playback/anchorEm': 0, 'playback/anchorTime': now(), 'playback/segmentIndex': -1 })

  const toEnd = () => {
    // Land the final line at the top of the reading band, playback paused.
    const end = Math.max(0, totalEmRef.current - settings.lineHeight)
    patch({
      'playback/playing': false,
      'playback/anchorEm': end,
      'playback/anchorTime': now(),
      'playback/segmentIndex': segments.length - 1,
    })
  }

  // Manual scrubbing from the preview (mouse wheel / touch drag). Freezes
  // playback and moves the shared anchor so the phone follows exactly.
  const manualScroll = (deltaEm: number) => {
    const pos = currentPos()
    const end = totalEmRef.current > 0 ? totalEmRef.current : Infinity
    const next = Math.min(end, Math.max(0, pos + deltaEm))
    patch({
      'playback/playing': false,
      'playback/anchorEm': next,
      'playback/anchorTime': now(),
    })
  }

  const nudge = (seconds: number) => {
    const deltaEm = (settings.speed > 0 ? settings.speed : 1) * seconds
    patch({
      'playback/anchorEm': Math.max(0, currentPos() + deltaEm),
      'playback/anchorTime': now(),
    })
  }

  const jumpToSegment = (index: number) => {
    const offset = segmentOffsetsRef.current[index]
    if (offset === undefined) return
    patch({
      'playback/anchorEm': offset,
      'playback/anchorTime': now(),
      'playback/segmentIndex': index,
    })
  }

  const toggleHighlight = (index: number) => {
    const seg = segments[index]
    if (!seg) return
    patch({ [`segments/${index}/highlighted`]: !seg.highlighted })
  }

  const addSpanHighlight = (index: number, range: Highlight) => {
    const seg = segments[index]
    if (!seg) return
    patch({ [`segments/${index}/highlights`]: addHighlight(seg.highlights, range, seg.text.length) })
  }

  const removeSpanHighlight = (index: number, range: Highlight) => {
    const seg = segments[index]
    if (!seg) return
    patch({
      [`segments/${index}/highlights`]: removeHighlight(seg.highlights, range, seg.text.length),
    })
  }

  const clearSpanHighlights = (index: number) => {
    patch({ [`segments/${index}/highlights`]: null })
  }

  const changeSettings = (p: Partial<Settings>) => {
    const values: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(p)) values[`settings/${k}`] = v
    patch(values)
  }

  // Speed changes rebase the anchor so the text doesn't jump
  const changeSpeed = (speed: number) => {
    patch({
      'settings/speed': speed,
      'playback/anchorEm': currentPos(),
      'playback/anchorTime': now(),
    })
  }

  const applyScript = (raw: string) => {
    patch({
      script: raw,
      segments: parseScript(raw),
      'playback/anchorEm': 0,
      'playback/anchorTime': now(),
      'playback/playing': false,
      'playback/segmentIndex': -1,
    })
  }

  const toggleCalibrationMode = () =>
    patch({ mode: mode === 'calibrate' ? 'prompt' : 'calibrate' })

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — code is visible anyway */
    }
  }

  // --- layout ---------------------------------------------------------------

  return (
    <main className="mx-auto max-w-7xl p-3 pb-28 sm:p-4 lg:pb-4">
      <header className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-3 sm:px-4">
        <h1>
          <Logo className="h-6 w-auto sm:h-7" />
        </h1>

        <button
          onClick={copyCode}
          title="Copy session code"
          className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 font-mono text-xl font-bold tracking-[0.25em] text-cyan-300 transition hover:border-cyan-500 sm:text-2xl sm:tracking-[0.3em]"
        >
          {code}
          {copied ? (
            <IconCheck size={18} className="text-emerald-400" />
          ) : (
            <IconCopy size={16} className="text-gray-500" />
          )}
        </button>

        <QRConnect code={code} />

        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm ${
            connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? 'animate-pulse bg-emerald-400' : 'bg-red-500'
            }`}
          />
          {connected
            ? `${displayList.length} display${displayList.length > 1 ? 's' : ''} connected`
            : 'No display'}
        </span>

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <span className="hidden text-xs text-gray-500 sm:inline">
            Band {Math.round(calibration.top * 100)}–{Math.round(calibration.bottom * 100)}%
          </span>
          <button
            onClick={toggleCalibrationMode}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none ${
              mode === 'calibrate'
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'border border-gray-700 bg-gray-950 hover:border-amber-500'
            }`}
          >
            {mode === 'calibrate' ? (
              <>
                <IconStop size={16} /> End calibration
              </>
            ) : (
              <>
                <IconCrosshair size={16} /> Calibrate phone
              </>
            )}
          </button>
        </div>
      </header>

      {mode === 'calibrate' && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          Calibration mode is active. On the phone, drag the two bars to frame exactly what is
          visible in the mirror, then tap <strong>Save calibration</strong> there — or end
          calibration here.
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Script + segments — second on mobile, left column on desktop */}
        <div className="order-2 space-y-4 lg:order-1 lg:w-1/2">
          <ScriptPanel script={session.script ?? ''} onApply={applyScript} />
          <SegmentList
            segments={segments}
            activeIndex={playback.segmentIndex >= 0 ? playback.segmentIndex : activeSegment}
            highlightColor={settings.highlightColor}
            onJump={jumpToSegment}
            onToggleHighlight={toggleHighlight}
            onAddHighlight={addSpanHighlight}
            onRemoveHighlight={removeSpanHighlight}
            onClearHighlights={clearSpanHighlights}
          />
        </div>

        {/* Preview + settings — first on mobile, right column on desktop */}
        <div className="order-1 space-y-4 lg:order-2 lg:w-1/2">
          <PreviewPane
            segments={segments}
            settings={settings}
            playback={playback}
            calibration={calibration}
            display={displayList[0] ?? null}
            now={now}
            onMeasure={onMeasure}
            onActiveSegment={onActiveSegment}
            onScrub={manualScroll}
          />
          {/* Transport docks to the bottom of the screen on mobile so play/pause
              is always reachable; inline in the column on desktop. */}
          <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:p-2">
            <Transport
              playing={playback.playing}
              onPlayPause={playPause}
              onToStart={toStart}
              onToEnd={toEnd}
              onNudge={nudge}
            />
          </div>
          <SettingsPanel settings={settings} onChange={changeSettings} onSpeedChange={changeSpeed} />
        </div>
      </div>
    </main>
  )
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center text-gray-300">{children}</div>
    </main>
  )
}
