'use client'

import { useEffect, useState } from 'react'

type Props = {
  script: string
  onApply: (raw: string) => void
}

export default function ScriptPanel({ script, onApply }: Props) {
  const [draft, setDraft] = useState(script)
  const dirty = draft !== script

  // Pick up script changes coming from another co-host, unless we have local edits
  useEffect(() => {
    setDraft((prev) => (prev === script ? prev : dirty ? prev : script))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script])

  return (
    <section className="flex flex-col rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Script</h2>
        <button
          onClick={() => onApply(draft)}
          disabled={!dirty}
          className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition enabled:hover:bg-cyan-500 disabled:opacity-40"
        >
          {dirty ? 'Apply script' : 'Applied'}
        </button>
      </div>
      <p className="mb-2 text-xs text-gray-500">
        Start a line with <code className="text-gray-300"># Name</code> to begin a segment. Without
        headings, each paragraph becomes a segment.
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        className="h-64 w-full resize-y rounded-md border border-gray-700 bg-gray-950 p-3 font-mono text-sm leading-relaxed text-gray-200 focus:border-cyan-500 focus:outline-none"
      />
    </section>
  )
}
