import type { ReactNode } from 'react'

/**
 * Flat, modern line-icon set. One consistent treatment for the whole app:
 * 24×24 grid, no fill (except solid media glyphs), currentColor stroke,
 * rounded caps/joins. Size with the `size` prop; color follows text color.
 */
type IconProps = { size?: number; className?: string; strokeWidth?: number }

function Icon({
  size = 20,
  className,
  strokeWidth = 2,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconPlay = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
  </Icon>
)

export const IconPause = (p: IconProps) => (
  <Icon {...p}>
    <rect x="7" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.4" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
  </Icon>
)

export const IconSkipStart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 5.5v13l-9-6.5z" fill="currentColor" />
    <line x1="6" y1="5.5" x2="6" y2="18.5" />
  </Icon>
)

export const IconSkipEnd = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 5.5v13l9-6.5z" fill="currentColor" />
    <line x1="18" y1="5.5" x2="18" y2="18.5" />
  </Icon>
)

export const IconRotateCcw = (p: IconProps) => (
  <Icon {...p}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </Icon>
)

export const IconRotateCw = (p: IconProps) => (
  <Icon {...p}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
  </Icon>
)

export const IconCrosshair = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </Icon>
)

export const IconStop = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
  </Icon>
)

export const IconQr = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <line x1="14" y1="14" x2="14" y2="17.5" />
    <line x1="14" y1="21" x2="17.5" y2="21" />
    <line x1="21" y1="14" x2="21" y2="21" />
    <line x1="17.5" y1="14" x2="21" y2="14" />
  </Icon>
)

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
)

export const IconCopy = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
)

export const IconX = (p: IconProps) => (
  <Icon {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
)

export const IconExpand = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
)

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
)

export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
)

export const IconSliders = (p: IconProps) => (
  <Icon {...p}>
    <line x1="21" y1="4" x2="14" y2="4" />
    <line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" />
    <line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" />
    <line x1="12" y1="20" x2="3" y2="20" />
    <line x1="14" y1="2" x2="14" y2="6" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="16" y1="18" x2="16" y2="22" />
  </Icon>
)

export const IconSmartphone = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="2" width="14" height="20" rx="2.5" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </Icon>
)

export const IconHighlighter = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 11-6 6v3h9l3-3" />
    <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
  </Icon>
)

export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
)

export const IconMoveVertical = (p: IconProps) => (
  <Icon {...p}>
    <polyline points="8 7 12 3 16 7" />
    <polyline points="8 17 12 21 16 17" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </Icon>
)
