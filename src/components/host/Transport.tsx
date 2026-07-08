'use client'

type Props = {
  playing: boolean
  onPlayPause: () => void
  onToStart: () => void
  onNudge: (seconds: number) => void
}

export default function Transport({ playing, onPlayPause, onToStart, onNudge }: Props) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-3 shadow-lg sm:p-4">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onToStart}
          title="Back to start"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-lg transition hover:border-gray-500 sm:px-4"
        >
          ⏮
        </button>
        <button
          onClick={() => onNudge(-5)}
          title="Back 5 seconds"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-base transition hover:border-gray-500 sm:px-4 sm:text-lg"
        >
          ↺ 5s
        </button>
        <button
          onClick={onPlayPause}
          className={`min-w-24 rounded-lg px-4 py-3 text-base font-semibold text-white transition sm:min-w-32 sm:px-6 sm:text-lg ${
            playing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => onNudge(5)}
          title="Forward 5 seconds"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-base transition hover:border-gray-500 sm:px-4 sm:text-lg"
        >
          ↻ 5s
        </button>
      </div>
    </section>
  )
}
