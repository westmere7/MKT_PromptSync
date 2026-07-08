'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession, isValidCode, sessionExists } from '@/lib/session'
import { IconPlus, IconSliders, IconSmartphone, IconX } from '@/components/icons'

const CARD = 'flex flex-col rounded-2xl border border-gray-700 bg-gray-900 p-8'

type JoinRole = 'host' | 'display'

export default function HomeCards({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [joinRole, setJoinRole] = useState<JoinRole | null>(null)

  const createNew = async () => {
    setBusy(true)
    setError('')
    try {
      const c = await createSession()
      router.push(`/host?code=${c}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session')
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <div className="grid w-full items-stretch gap-4 sm:grid-cols-2">
        {/* New session — creates and opens the host controls directly */}
        <div className={CARD}>
          <IconPlus size={32} className="text-cyan-400" />
          <h2 className="mt-3 text-xl font-semibold">New session</h2>
          <p className="mt-1 text-sm text-gray-400">
            Create a fresh session and open the host controls. You&apos;ll get a 4-letter code (and
            QR) to connect a display.
          </p>
          <div className="mt-auto pt-6">
            <button
              onClick={createNew}
              disabled={busy || !configured}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-cyan-500 disabled:opacity-40"
            >
              <IconPlus size={18} />
              {busy ? 'Creating…' : 'New session'}
            </button>
          </div>
        </div>

        {/* Join — pick a role first; the code input appears in a popup */}
        <div className={CARD}>
          <IconSmartphone size={32} className="text-cyan-400" />
          <h2 className="mt-3 text-xl font-semibold">Join a session</h2>
          <p className="mt-1 text-sm text-gray-400">
            Open an existing session. Pick how this device connects, then enter the 4-letter code.
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
            <button
              onClick={() => setJoinRole('host')}
              disabled={!configured}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950 px-3 py-3 text-sm font-medium transition enabled:hover:border-cyan-500 disabled:opacity-40"
            >
              <IconSliders size={16} /> As host
            </button>
            <button
              onClick={() => setJoinRole('display')}
              disabled={!configured}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950 px-3 py-3 text-sm font-medium transition enabled:hover:border-cyan-500 disabled:opacity-40"
            >
              <IconSmartphone size={16} /> As display
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}

      {joinRole && (
        <JoinCodeModal
          role={joinRole}
          onClose={() => setJoinRole(null)}
          onSubmit={(code) => router.push(`/${joinRole}?code=${code}`)}
        />
      )}
    </div>
  )
}

function JoinCodeModal({
  role,
  onClose,
  onSubmit,
}: {
  role: JoinRole
  onClose: () => void
  onSubmit: (code: string) => void
}) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const valid = isValidCode(code)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      if (await sessionExists(code)) {
        onSubmit(code) // navigates; keep busy so the button can't fire twice
      } else {
        setError(`No session found for ${code}. Check the code on the host screen.`)
        setBusy(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
        >
          <IconX size={20} />
        </button>

        <div className="mb-1 flex items-center gap-2 text-cyan-400">
          {role === 'host' ? <IconSliders size={18} /> : <IconSmartphone size={18} />}
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Join as {role === 'host' ? 'host' : 'display'}
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-400">
          Enter the 4-letter code shown on the host device.
        </p>

        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={4}
          autoFocus
          autoComplete="off"
          placeholder="CODE"
          aria-label="Session code"
          className="w-full rounded-xl border-2 border-gray-700 bg-gray-950 px-4 py-4 text-center font-mono text-4xl font-bold tracking-[0.35em] text-cyan-300 placeholder-gray-800 focus:border-cyan-500 focus:outline-none"
        />

        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={!valid || busy}
          className="mt-4 w-full rounded-xl bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition enabled:hover:bg-cyan-500 disabled:opacity-40"
        >
          {busy ? 'Checking…' : role === 'host' ? 'Open host controls' : 'Open display'}
        </button>
      </div>
    </div>
  )
}
