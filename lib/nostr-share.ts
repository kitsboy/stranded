/** Build a shareable Nostr web-client URL for posting a note with text + link. */
export function buildNostrShareUrl(text: string, url: string): string {
  const note = [text.trim(), url.trim()].filter(Boolean).join('\n')
  return `https://snort.social/?note=${encodeURIComponent(note)}`
}