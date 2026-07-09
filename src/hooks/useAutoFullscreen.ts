'use client'

import { useEffect } from 'react'

/**
 * Enter fullscreen (and lock landscape) as early as possible while `enabled`,
 * without any button or prompt.
 *
 * The Fullscreen API requires a user gesture (transient activation), which a
 * QR-scan navigation does not carry — so we try immediately (works if the
 * browser happens to grant activation) and otherwise arm one-shot listeners
 * that fire on the very first tap/click/key. Once fullscreen is achieved the
 * listeners remove themselves. No-op where the API is unavailable, e.g. Safari
 * on iPhone (there `requestFullscreen` is not a function).
 */
export function useAutoFullscreen(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    if (typeof root.requestFullscreen !== 'function') return

    let done = false
    const events = ['pointerdown', 'touchend', 'click', 'keydown'] as const
    const cleanup = () => events.forEach((e) => document.removeEventListener(e, onGesture, true))

    const enter = () => {
      if (done || document.fullscreenElement) {
        done = true
        cleanup()
        return
      }
      root
        .requestFullscreen()
        .then(() => {
          done = true
          // Orientation lock is only allowed in fullscreen, and only on some
          // platforms (ignored on iOS) — best effort.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
          cleanup()
        })
        .catch(() => {
          /* no activation yet — wait for the first gesture */
        })
    }
    const onGesture = () => enter()

    enter() // best-effort immediate attempt (usually blocked on a fresh load)
    events.forEach((e) => document.addEventListener(e, onGesture, true))
    return cleanup
  }, [enabled])
}
