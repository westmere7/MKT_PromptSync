import Link from 'next/link'
import { isFirebaseConfigured } from '@/lib/firebase'
import Logo from '@/components/Logo'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <Logo className="mx-auto h-12 w-auto sm:h-14" />
        <p className="mt-4 text-gray-400">
          Remote-controlled teleprompter. Host on a desktop, display on a phone, live-synced.
        </p>
      </div>

      {!isFirebaseConfigured() && (
        <div className="w-full rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Firebase not configured.</strong> Copy <code>.env.local.example</code> to{' '}
          <code>.env.local</code>, fill in your Firebase project keys, and restart the dev server.
          See README for setup steps.
        </div>
      )}

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link
          href="/host"
          className="group rounded-2xl border border-gray-700 bg-gray-900 p-8 transition hover:border-cyan-500"
        >
          <div className="text-3xl">🎛️</div>
          <h2 className="mt-3 text-xl font-semibold group-hover:text-cyan-400">Host a session</h2>
          <p className="mt-1 text-sm text-gray-400">
            Desktop or second phone. Load the script, control speed, size, segments and highlights
            live.
          </p>
        </Link>

        <Link
          href="/display"
          className="group rounded-2xl border border-gray-700 bg-gray-900 p-8 transition hover:border-cyan-500"
        >
          <div className="text-3xl">📱</div>
          <h2 className="mt-3 text-xl font-semibold group-hover:text-cyan-400">Join as display</h2>
          <p className="mt-1 text-sm text-gray-400">
            The phone that goes into the teleprompter rig. Enter the 4-letter code, calibrate,
            roll.
          </p>
        </Link>
      </div>

      <p className="text-xs text-gray-600">
        No login. Sessions live under their 4-letter code — share the code to co-host.
      </p>
    </main>
  )
}
