'use client'

import { useEffect, useState } from 'react'

export type KeepAwakeMethod = 'wakelock' | 'video' | null

/**
 * Keeps the device screen from sleeping/dimming while mounted, and reports
 * which mechanism (if any) is currently holding it awake.
 *
 * Primary path is the Screen Wake Lock API. The browser silently drops that
 * lock whenever the tab is hidden, and on some devices after system events, so
 * we re-request it on both `visibilitychange` and the sentinel's own `release`.
 *
 * Wake Lock is only exposed in a **secure context** (HTTPS / localhost). During
 * real shoots the phone usually loads the display over plain-HTTP LAN, where
 * `navigator.wakeLock` is `undefined`. There we fall back to quietly playing a
 * muted 1×1 video off a canvas stream — mobile browsers keep the screen on
 * while media is playing. Muted + playsinline lets it autoplay without a user
 * gesture. If neither works this returns `null`, so the UI can tell the
 * operator to disable auto-lock in device settings as a last resort.
 */
export function useKeepAwake(enabled = true): KeepAwakeMethod {
  const [method, setMethod] = useState<KeepAwakeMethod>(null)

  useEffect(() => {
    if (!enabled) return
    let sentinel: WakeLockSentinel | null = null
    let stopVideo: (() => void) | null = null
    let cancelled = false

    // Fallback for non-secure contexts (LAN HTTP) and browsers without the
    // Wake Lock API: keep a muted, off-screen video playing.
    const startVideoFallback = () => {
      if (stopVideo) return
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext('2d')
      const stream = ctx && canvas.captureStream ? canvas.captureStream() : null
      if (!ctx || !stream) return

      const video = document.createElement('video')
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      Object.assign(video.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '1px',
        height: '1px',
        opacity: '0',
        pointerEvents: 'none',
      })
      video.srcObject = stream
      document.body.appendChild(video)

      // Nudge a pixel each frame so the captured stream stays "live". rAF only
      // ticks while the tab is visible — which is exactly when we need it.
      let raf = 0
      const tick = () => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillRect(0, 0, 1, 1)
        raf = requestAnimationFrame(tick)
      }
      tick()

      video
        .play()
        .then(() => !cancelled && setMethod('video'))
        .catch(() => {
          /* autoplay blocked — nothing more we can do here */
        })

      stopVideo = () => {
        cancelAnimationFrame(raf)
        video.pause()
        video.srcObject = null
        stream.getTracks().forEach((t) => t.stop())
        video.remove()
        stopVideo = null
      }
    }

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      if (navigator.wakeLock) {
        try {
          const s = await navigator.wakeLock.request('screen')
          if (cancelled) {
            s.release().catch(() => {})
            return
          }
          sentinel = s
          setMethod('wakelock')
          s.addEventListener('release', () => {
            sentinel = null
            if (!cancelled && document.visibilityState === 'visible') acquire()
          })
          return
        } catch {
          /* not allowed (e.g. insecure context) — fall through to video */
        }
      }
      startVideoFallback()
    }

    acquire()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel) acquire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      sentinel?.release().catch(() => {})
      stopVideo?.()
    }
  }, [enabled])

  return method
}
