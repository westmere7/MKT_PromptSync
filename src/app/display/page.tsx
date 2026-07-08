'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onDisconnect, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { getDb, isFirebaseConfigured } from '@/lib/firebase'
import { isValidCode, sessionExists, sessionPath } from '@/lib/session'
import { useSessionData } from '@/hooks/useSessionData'
import { useServerNow } from '@/hooks/useServerNow'
import PrompterCanvas from '@/components/PrompterCanvas'
import CalibrationView from '@/components/display/CalibrationView'
import Logo from '@/components/Logo'
import {
  IconCrosshair,
  IconExpand,
  IconPause,
  IconPlay,
  IconRotateCw,
  IconSliders,
  IconX,
} from '@/components/icons'

export default function DisplayPage() {
  const [code, setCode] = useState<string | null>(null)
  const [initialCode, setInitialCode] = useState('')

  // Support QR/deep links: /display?code=CBHU pre-fills and auto-connects.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('code')?.toUpperCase() ?? ''
    if (isValidCode(param)) setInitialCode(param)
  }, [])

  return code ? (
    <DisplayScreen code={code} onExit={() => setCode(null)} />
  ) : (
    <CodeEntry initialCode={initialCode} onJoin={setCode} />
  )
}

// --- code entry --------------------------------------------------------------

function CodeEntry({
  initialCode,
  onJoin,
}: {
  initialCode: string
  onJoin: (code: string) => void
}) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const autoTried = useRef(false)

  const join = useCallback(
    async (raw?: string) => {
      const target = (raw ?? value).toUpperCase()
      if (!isValidCode(target)) return
      setBusy(true)
      setError('')
      try {
        if (await sessionExists(target)) onJoin(target)
        else setError(`No session found for ${target}. Check the code on the host screen.`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection failed')
      } finally {
        setBusy(false)
      }
    },
    [value, onJoin]
  )

  // Prefill and auto-connect once when arriving via a QR/deep link
  useEffect(() => {
    if (!initialCode || autoTried.current) return
    autoTried.current = true
    setValue(initialCode)
    join(initialCode)
  }, [initialCode, join])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-6">
      <div className="flex flex-col items-center gap-2">
        <Logo className="h-9 w-auto" />
        <span className="text-sm font-medium uppercase tracking-[0.3em] text-gray-500">Display</span>
      </div>
      <p className="text-center text-sm text-gray-500">
        Enter the 4-letter code shown on the host device
      </p>

      {!isFirebaseConfigured() && (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          Firebase is not configured — set up <code>.env.local</code> first (see README).
        </p>
      )}

      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && join()}
        maxLength={4}
        autoFocus
        autoComplete="off"
        placeholder="CBHU"
        className="w-64 rounded-2xl border-2 border-gray-700 bg-gray-950 px-4 py-5 text-center font-mono text-5xl font-bold tracking-[0.35em] text-cyan-300 placeholder-gray-800 focus:border-cyan-500 focus:outline-none"
      />

      <button
        onClick={() => join()}
        disabled={!isValidCode(value) || busy || !isFirebaseConfigured()}
        className="w-64 rounded-2xl bg-cyan-600 px-6 py-4 text-xl font-semibold text-white transition enabled:active:bg-cyan-500 disabled:opacity-40"
      >
        {busy ? 'Connecting…' : 'Connect'}
      </button>

      {error && <p className="max-w-xs text-center text-sm text-red-400">{error}</p>}

      <a
        href="/host"
        className="mt-4 flex items-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-400 transition hover:border-gray-600 hover:text-gray-200"
      >
        <IconSliders size={16} />
        Switch to host mode
      </a>
    </main>
  )
}

// --- connected display -------------------------------------------------------

function DisplayScreen({ code, onExit }: { code: string; onExit: () => void }) {
  const session = useSessionData(code)
  const now = useServerNow()
  const clientIdRef = useRef(`d-${Math.random().toString(36).slice(2, 10)}`)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [overlay, setOverlay] = useState(true)
  const [isPortrait, setIsPortrait] = useState(false)

  // Presence: register this display, clean up automatically on disconnect
  useEffect(() => {
    const presenceRef = ref(
      getDb(),
      `${sessionPath(code)}/displays/${clientIdRef.current}`
    )
    const report = () =>
      update(presenceRef, {
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio ?? 1,
      })

    set(presenceRef, {
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: window.devicePixelRatio ?? 1,
      joinedAt: serverTimestamp(),
    })
    onDisconnect(presenceRef).remove()

    const measure = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight })
      setIsPortrait(window.innerHeight > window.innerWidth)
      report()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      remove(presenceRef)
    }
  }, [code])

  // Keep the screen awake during takes
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null
    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock?.request('screen')
      } catch {
        /* not supported or not allowed — non-fatal */
      }
    }
    acquire()
    const onVisible = () => document.visibilityState === 'visible' && acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      sentinel?.release().catch(() => {})
    }
  }, [])

  // Auto-hide the overlay
  useEffect(() => {
    if (!overlay) return
    const t = setTimeout(() => setOverlay(false), 5000)
    return () => clearTimeout(t)
  }, [overlay])

  const goFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      // Best effort — orientation lock is only allowed in fullscreen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (screen.orientation as any)?.lock?.('landscape')
    } catch {
      /* unsupported (e.g. iOS Safari) — non-fatal */
    }
  }, [])

  if (session === undefined) {
    return <FullBlack>Connecting to {code}…</FullBlack>
  }
  if (session === null) {
    return (
      <FullBlack>
        Session {code} has ended.
        <button onClick={onExit} className="mt-4 block w-full text-cyan-400 underline">
          Back
        </button>
      </FullBlack>
    )
  }

  const segments = session.segments ?? []

  if (session.mode === 'calibrate') {
    return (
      <CalibrationView
        code={code}
        calibration={session.calibration}
        settings={session.settings}
        sampleText={segments[0]?.text ?? 'Sample text — load a script on the host device.'}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black" onClick={() => setOverlay((v) => !v)}>
      {viewport.w > 0 && (
        <PrompterCanvas
          segments={segments}
          settings={session.settings}
          playback={session.playback}
          calibration={session.calibration}
          now={now}
          width={viewport.w}
          height={viewport.h}
          deviceWidth={viewport.w}
          applyMirror
          maskOpacity={1}
        />
      )}

      {isPortrait && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center text-center text-gray-500">
          <IconRotateCw size={40} />
          <p className="mt-2 text-sm">Rotate to landscape for the teleprompter rig</p>
        </div>
      )}

      {overlay && (
        <div
          className="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/90 to-transparent p-3 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-mono font-bold tracking-widest text-cyan-400">{code}</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> live
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            {session.playback.playing ? <IconPlay size={14} /> : <IconPause size={14} />}
            {session.playback.playing ? 'rolling' : 'paused'}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={goFullscreen}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-1.5"
            >
              <IconExpand size={16} /> Fullscreen
            </button>
            <button
              onClick={() => update(ref(getDb(), sessionPath(code)), { mode: 'calibrate' })}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-1.5"
            >
              <IconCrosshair size={16} /> Calibrate
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-1.5 text-red-400"
            >
              <IconX size={16} /> Exit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FullBlack({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-gray-400">
      <div className="text-center">{children}</div>
    </main>
  )
}
