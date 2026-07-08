import { isFirebaseConfigured } from '@/lib/firebase'
import Logo from '@/components/Logo'
import HomeCards from '@/components/HomeCards'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <Logo className="mx-auto h-12 w-auto sm:h-14" />
        <p className="mt-4 text-gray-400">
          Remote-controlled teleprompter. Host on any device, display on a phone, live-synced, full
          control.
        </p>
      </div>

      {!isFirebaseConfigured() && (
        <div className="w-full rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Firebase not configured.</strong> Copy <code>.env.local.example</code> to{' '}
          <code>.env.local</code>, fill in your Firebase project keys, and restart the dev server.
          See README for setup steps.
        </div>
      )}

      <HomeCards configured={isFirebaseConfigured()} />

      <p className="text-xs text-gray-600">
        No login. Sessions live under their 4-letter code — share the code to co-host.
      </p>
    </main>
  )
}
