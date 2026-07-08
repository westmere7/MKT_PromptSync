'use client'

import { useEffect } from 'react'
import { touchSession } from '@/lib/session'

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000

/**
 * While a session is open on this device, periodically refresh its
 * `lastActive` timestamp so it is not treated as idle. Pass `null` to
 * disable (e.g. once the session has expired).
 */
export function useHeartbeat(code: string | null): void {
  useEffect(() => {
    if (!code) return
    touchSession(code).catch(() => {})
    const id = setInterval(() => touchSession(code).catch(() => {}), HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [code])
}
