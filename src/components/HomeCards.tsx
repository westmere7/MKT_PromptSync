'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession, isValidCode } from '@/lib/session'
import { IconPlus, IconSliders, IconSmartphone } from '@/components/icons'

const CARD = 'flex flex-col rounded-2xl border border-gray-700 bg-gray-900 p-8'

export default function HomeCards({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const valid = isValidCode(code)

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

        {/* Join — enter a code, open as host or as display */}
        <div className={CARD}>
          <IconSmartphone size={32} className="text-cyan-400" />
          <h2 className="mt-3 text-xl font-semibold">Join a session</h2>
          <p className="mt-1 text-sm text-gray-400">
            Enter the 4-letter code, then open it as the host controller or as the display phone.
          </p>
          <div className="mt-auto pt-6">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              maxLength={4}
              placeholder="CODE"
              aria-label="Session code"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-center font-mono text-2xl font-bold tracking-[0.3em] text-cyan-300 placeholder-gray-700 focus:border-cyan-500 focus:outline-none"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => valid && router.push(`/host?code=${code}`)}
                disabled={!valid || !configured}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm font-medium transition enabled:hover:border-cyan-500 disabled:opacity-40"
              >
                <IconSliders size={16} /> As host
              </button>
              <button
                onClick={() => valid && router.push(`/display?code=${code}`)}
                disabled={!valid || !configured}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm font-medium transition enabled:hover:border-cyan-500 disabled:opacity-40"
              >
                <IconSmartphone size={16} /> As display
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
    </div>
  )
}
