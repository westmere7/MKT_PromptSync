import Link from 'next/link'

/**
 * RMIT PromptSync wordmark (white, ~5:1), linked to home. Size it with a height
 * class, e.g. <Logo className="h-8 w-auto" />. Served statically from /public,
 * so we use a plain <img> rather than next/image (SVGs skip the optimizer).
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="RMIT PromptSync — home" className="inline-flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/PromptSync_Logo.svg" alt="RMIT PromptSync" className={className} />
    </Link>
  )
}
