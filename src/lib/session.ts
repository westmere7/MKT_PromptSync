import { get, ref, serverTimestamp, set } from 'firebase/database'
import { getDb } from './firebase'
import {
  DEFAULT_CALIBRATION,
  DEFAULT_PLAYBACK,
  DEFAULT_SETTINGS,
  type Segment,
} from './types'

// No I or O — too easy to misread on a phone at arm's length
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]
  }
  return code
}

export function isValidCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code)
}

const SAMPLE_SCRIPT = `# Intro
Welcome to RMIT PromptSync. This is your sample script. Replace it with your own from the host panel.

# Segment 2
Each line starting with a hash sign begins a new segment. Segments can be jumped to and highlighted on the fly from the host device.

# Outro
Thanks for watching, and don't forget to calibrate the display before the first take.`

/**
 * Parse a raw script into segments.
 * Lines starting with `#` begin a named segment.
 * If the script has no `#` headings, paragraphs (blank-line separated) become segments.
 */
export function parseScript(raw: string): Segment[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  const segments: Segment[] = []
  if (/^#/m.test(trimmed)) {
    let current: Segment | null = null
    for (const line of trimmed.split('\n')) {
      const heading = line.match(/^#+\s*(.*)$/)
      if (heading) {
        current = {
          id: `seg-${segments.length}`,
          name: heading[1] || `Segment ${segments.length + 1}`,
          text: '',
        }
        segments.push(current)
      } else {
        if (!current) {
          current = { id: `seg-${segments.length}`, name: `Segment ${segments.length + 1}`, text: '' }
          segments.push(current)
        }
        current.text += (current.text ? '\n' : '') + line
      }
    }
  } else {
    for (const para of trimmed.split(/\n\s*\n/)) {
      segments.push({
        id: `seg-${segments.length}`,
        name: `Segment ${segments.length + 1}`,
        text: para.trim(),
      })
    }
  }
  return segments.map((s) => ({ ...s, text: s.text.trim() })).filter((s) => s.text || s.name)
}

export function sessionPath(code: string): string {
  return `sessions/${code}`
}

/** Create a new session under a fresh 4-letter code and return the code. */
export async function createSession(): Promise<string> {
  const db = getDb()
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode()
    const r = ref(db, sessionPath(code))
    const snap = await get(r)
    if (snap.exists()) continue
    await set(r, {
      createdAt: serverTimestamp(),
      mode: 'calibrate',
      script: SAMPLE_SCRIPT,
      segments: parseScript(SAMPLE_SCRIPT),
      settings: DEFAULT_SETTINGS,
      playback: DEFAULT_PLAYBACK,
      calibration: DEFAULT_CALIBRATION,
    })
    return code
  }
  throw new Error('Could not allocate a free session code, please retry.')
}

export async function sessionExists(code: string): Promise<boolean> {
  const snap = await get(ref(getDb(), sessionPath(code)))
  return snap.exists()
}
