/** A highlighted character range within a segment's text, [start, end). */
export type Highlight = { start: number; end: number }

export type Segment = {
  id: string
  name: string
  text: string
  /** Whole-segment highlight (colors all text) */
  highlighted?: boolean
  /** Span highlights on selected text within the segment */
  highlights?: Highlight[]
}

export type Settings = {
  /** Font size in CSS px on the display phone */
  fontSize: number
  /** Scroll speed in em per second (scales with font size) */
  speed: number
  lineHeight: number
  fontFamily: string
  /** Flip horizontally for the semi-transparent mirror */
  mirror: boolean
  highlightColor: string
}

export type Playback = {
  playing: boolean
  /** Scroll offset in em at the moment anchorTime was written */
  anchorEm: number
  /** Server-clock epoch ms when anchorEm was written */
  anchorTime: number
  /** Segment index of the last jump target (-1 = none) */
  segmentIndex: number
}

export type Calibration = {
  /** Top bar position as a fraction of screen height (0..1) */
  top: number
  /** Bottom bar position as a fraction of screen height (0..1) */
  bottom: number
}

export type DisplayInfo = {
  w: number
  h: number
  dpr: number
  joinedAt: number
}

export type SessionMode = 'calibrate' | 'prompt'

export type SessionData = {
  createdAt: number
  mode: SessionMode
  script: string
  segments?: Segment[]
  settings: Settings
  playback: Playback
  calibration: Calibration
  displays?: Record<string, DisplayInfo>
}

export const FONT_OPTIONS = [
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Georgia',
  'Times New Roman',
  'Courier New',
] as const

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 48,
  speed: 1.2,
  lineHeight: 1.4,
  fontFamily: 'Arial',
  mirror: false,
  highlightColor: '#ffd60a',
}

export const DEFAULT_PLAYBACK: Playback = {
  playing: false,
  anchorEm: 0,
  anchorTime: 0,
  segmentIndex: -1,
}

export const DEFAULT_CALIBRATION: Calibration = {
  top: 0.15,
  bottom: 0.85,
}
