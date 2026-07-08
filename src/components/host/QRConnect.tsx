'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  code: string
  connected: boolean
}

export default function QRConnect({ code, connected }: Props) {
  const [joinUrl, setJoinUrl] = useState('')
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/display?code=${code}`)
  }, [code])

  // Collapse once a display is connected; reopen if the display drops
  useEffect(() => {
    setOpen(!connected)
  }, [connected])

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Connect a display
        </h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          {open ? 'Hide' : 'Show QR'}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
          {joinUrl && (
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={joinUrl} size={132} level="M" />
            </div>
          )}
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-400">Scan with the display phone, or enter the code:</p>
            <div className="my-1 font-mono text-3xl font-bold tracking-[0.3em] text-cyan-300">
              {code}
            </div>
            <p className="break-all text-xs text-gray-600">{joinUrl}</p>
          </div>
        </div>
      )}
    </section>
  )
}
