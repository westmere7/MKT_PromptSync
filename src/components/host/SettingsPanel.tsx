'use client'

import { FONT_OPTIONS, type Settings } from '@/lib/types'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onSpeedChange: (speed: number) => void
}

export default function SettingsPanel({ settings, onChange, onSpeedChange }: Props) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Prompter settings
      </h2>

      <div className="space-y-4">
        <label className="block">
          <div className="mb-1 flex justify-between text-sm">
            <span>Font size</span>
            <span className="text-cyan-400">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min={24}
            max={120}
            step={2}
            value={settings.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="w-full"
          />
        </label>

        <label className="block">
          <div className="mb-1 flex justify-between text-sm">
            <span>Scroll speed</span>
            <span className="text-cyan-400">{settings.speed.toFixed(1)} lines/s</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={settings.speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="block">
          <div className="mb-1 flex justify-between text-sm">
            <span>Line height</span>
            <span className="text-cyan-400">{settings.lineHeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={1.1}
            max={2}
            step={0.05}
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-full"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="mb-1 text-sm">Font</div>
            <select
              value={settings.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm">Highlight color</div>
            <input
              type="color"
              value={settings.highlightColor}
              onChange={(e) => onChange({ highlightColor: e.target.value })}
              className="h-8 w-full cursor-pointer rounded-md border border-gray-700 bg-gray-800"
            />
          </label>
        </div>

        <div>
          <div className="mb-1.5 text-sm">Mirror on phone (for mirror rigs)</div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.mirrorH}
                onChange={(e) => onChange({ mirrorH: e.target.checked })}
                className="h-4 w-4 accent-cyan-400"
              />
              Horizontal (left–right)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.mirrorV}
                onChange={(e) => onChange({ mirrorV: e.target.checked })}
                className="h-4 w-4 accent-cyan-400"
              />
              Vertical (up–down)
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
