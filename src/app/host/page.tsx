'use client'

import { Suspense, useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ref, update } from 'firebase/database'
import { getDb, isFirebaseConfigured } from '@/lib/firebase'
import { createSession, isValidCode, parseScript, sessionPath } from '@/lib/session'
import { positionAt } from '@/lib/scroll'
import { useSessionData } from '@/hooks/useSessionData'
import { useServerNow } from '@/hooks/useServerNow'
import type { Settings } from '@/lib/types'
import ScriptPanel from '@/components/host/ScriptPanel'
import SegmentList from '@/components/host/SegmentList'
import SettingsPanel from '@/components/host/SettingsPanel'
import Transport from '@/components/host/Transport'
import PreviewPane from '@/components/host/PreviewPane'

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
      <h1 className="text-2xl font-bold">Host a session</h1>

      {!isFirebaseConfigured() && (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          Firebase is not configured — set up <code>.env.local</code> first (see README).
        </p>
      )}

      <button
        onClick={startNew}
        disabled={busy || !isFirebaseConfigured()}
        className="w-full rounded-xl bg-cyan-600 px-6 py-4 text-lg font-semibold text-white transition enabled:hover:bg-cyan-500 disabled:opacity-40"
      >
        {busy ? 'Creating…' : '➕ New session'}
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
  const [activeSegment, setActiveSegment] = useState(-1)
  const [copied, setCopied] = useState(false)

  const base = sessionPath(code)
  const patch = useCallback(
    (values: Record<string, unknown>) => update(ref(getDb(), base), values),
    [base]
  )

  const onMeasure = useCallback((offsets: number[]) => {
    segmentOffsetsRef.current = offsets
  }, [])
  const onActiveSegment = useCallback((i: number) => setActiveSegment(i), [])

  if (session === undefined) {
    return <CenterMessage>Loading session {code}…</CenterMessage>
  }
  if (session === null) {
    return (
      <CenterMessage>
        Session <span className="font-mono text-cyan-400">{code}</span> was not found. It may have
        expired or the code was mistyped.
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
    <main className="mx-auto max-w-7xl p-4">
      <header className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
        <h1 className="text-lg font-bold">
          RMIT <span className="text-cyan-400">PromptSync</span>
        </h1>

        <button
          onClick={copyCode}
          title="Copy session code"
          className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-1.5 font-mono text-2xl font-bold tracking-[0.3em] text-cyan-300 transition hover:border-cyan-500"
        >
          {copied ? '✓ copied' : code}
        </button>

        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            connected
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? 'animate-pulse bg-emerald-400' : 'bg-red-500'
            }`}
          />
          {connected
            ? `${displayList.length} display${displayList.length > 1 ? 's' : ''} connected`
            : 'No display connected'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Band {Math.round(calibration.top * 100)}–{Math.round(calibration.bottom * 100)}%
          </span>
          <button
            onClick={toggleCalibrationMode}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === 'calibrate'
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'border border-gray-700 bg-gray-950 hover:border-amber-500'
            }`}
          >
            {mode === 'calibrate' ? '⏹ End calibration' : '🎯 Calibrate phone'}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ScriptPanel script={session.script ?? ''} onApply={applyScript} />
          <SegmentList
            segments={segments}
            activeIndex={playback.segmentIndex >= 0 ? playback.segmentIndex : activeSegment}
            highlightColor={settings.highlightColor}
            onJump={jumpToSegment}
            onToggleHighlight={toggleHighlight}
          />
        </div>

        <div className="space-y-4">
          <PreviewPane
            segments={segments}
            settings={settings}
            playback={playback}
            calibration={calibration}
            display={displayList[0] ?? null}
            now={now}
            onMeasure={onMeasure}
            onActiveSegment={onActiveSegment}
          />
          <Transport
            playing={playback.playing}
            onPlayPause={playPause}
            onToStart={toStart}
            onNudge={nudge}
          />
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
