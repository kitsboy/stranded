'use client'

/**
 * Mobile primary actions live inside the sticky Footer now
 * (see Footer.tsx). Kept as a no-op so layout imports stay stable.
 * Previously a fixed bar at bottom-14 sat under the footer (z-index
 * fight) and looked like half-visible orange/outline button ghosts.
 */
export default function MobileCtaBar() {
  return null
}
