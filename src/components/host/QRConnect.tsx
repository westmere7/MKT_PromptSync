'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { IconQr, IconX } from '@/components/icons'

type Props = {
  code: string
  connected: boolean
}

export default function QRConnect({ code, connected }: Props) {
  const [open, setOpen] = useState(false)
  const [joinUrl, setJoinUrl] = useState('')

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/display?code=${code}`)
  }, [code])

  // The QR's job is done once a display connects — close it automatically.
  useEffect(() => {
    if (connected) setOpen(false)
  }, [connected])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Show QR code to connect a display"
        className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 transition hover:border-cyan-500"
      >
        <IconQr size={18} />
        <span className="hidden sm:inline">Show QR</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
            >
              <IconX size={20} />
            </button>

            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Connect a display
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              Scan with the display phone, or enter the code manually.
            </p>

            <div className="flex flex-col items-center gap-4">
              {joinUrl && (
                <div className="rounded-xl bg-white p-4">
                  <QRCodeSVG value={joinUrl} size={200} level="M" />
                </div>
              )}
              <div className="text-center">
                <div className="font-mono text-4xl font-bold tracking-[0.3em] text-cyan-300">
                  {code}
                </div>
                <p className="mt-2 break-all text-xs text-gray-600">{joinUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
