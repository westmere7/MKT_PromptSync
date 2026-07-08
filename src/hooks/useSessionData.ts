'use client'

import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { getDb } from '@/lib/firebase'
import { sessionPath } from '@/lib/session'
import type { SessionData } from '@/lib/types'

/**
 * Live subscription to a session.
 * Returns `undefined` while loading, `null` if the session does not exist.
 */
export function useSessionData(code: string | null): SessionData | null | undefined {
  const [data, setData] = useState<SessionData | null | undefined>(undefined)

  useEffect(() => {
    if (!code) return
    setData(undefined)
    const unsubscribe = onValue(ref(getDb(), sessionPath(code)), (snap) => {
      setData((snap.val() as SessionData | null) ?? null)
    })
    return unsubscribe
  }, [code])

  return code ? data : undefined
}
