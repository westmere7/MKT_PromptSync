'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isValidCode } from '@/lib/session'
import { IconPlus, IconSliders } from '@/components/icons'

export default function HostCard() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const open = () => {
    if (isValidCode(code)) router.push(`/host?code=${code}`)
  }

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-8">
      <IconSliders size={32} className="text-cyan-400" />
      <h2 className="mt-3 text-xl font-semibold">Host a session</h2>
      <p className="mt-1 text-sm text-gray-400">
        Desktop or second phone. Load the script, control speed, size, segments and highlights live.
      </p>

      <Link
        href="/host"
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
      >
        <IconPlus size={18} /> New session
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-800" />
        <span className="text-xs text-gray-600">or open an existing code</span>
        <div className="h-px flex-1 bg-gray-800" />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && open()}
          maxLength={4}
          placeholder="CODE"
          aria-label="Session code"
          className="w-28 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-center font-mono text-lg tracking-[0.2em] text-cyan-300 placeholder-gray-700 focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={open}
          disabled={!isValidCode(code)}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm font-medium transition enabled:hover:border-cyan-500 disabled:opacity-40"
        >
          Open session
        </button>
      </div>
    </div>
  )
}
