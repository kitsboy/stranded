'use client'

/**
 * Legacy client-side password gate — removed for security.
 * Public ECCC data does not need a browser password; private previews
 * must use edge auth (e.g. Cloudflare Access), never client-side secrets.
 *
 * This stub keeps accidental imports from breaking the build.
 */
export default function PasswordGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
