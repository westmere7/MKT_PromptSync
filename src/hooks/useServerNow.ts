'use client'

import { useCallback, useEffect, useRef } from 'react'
import { onValue, ref } from 'firebase/database'
import { getDb } from '@/lib/firebase'

/**
 * Returns a `now()` function aligned to the Firebase server clock.
 * All devices anchor playback to server time, so their local clocks don't
 * need to agree with each other.
 */
export function useServerNow(): () => number {
  const offsetRef = useRef(0)

  useEffect(() => {
    const unsubscribe = onValue(ref(getDb(), '.info/serverTimeOffset'), (snap) => {
      offsetRef.current = (snap.val() as number | null) ?? 0
    })
    return unsubscribe
  }, [])

  return useCallback(() => Date.now() + offsetRef.current, [])
}
