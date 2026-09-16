/**
 * HowProofWorks — the family's shared proof explainer.
 *
 * These tests pin the honesty rules, not the pixel layout:
 *   1. a chain-resolved verdict says so, and says HOW it was resolved
 *   2. a pending proof is never dressed up as a confirmed one
 *   3. a proof that does not resolve is reported plainly — never softened
 *   4. the "check it yourself" step is always offered (the user must keep the
 *      means to audit, not just our assurance)
 *   5. labels are overridable, so every offering can ship its own copy
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HowProofWorks, { stateFromVerdict } from './HowProofWorks'

const ownNodeVerdict = {
  verified: true,
  verified_method: 'bitcoind',
  trust: 'self-sovereign',
  bitcoin_block_height: 963545,
  block_time: 1787379938,
  block_hash: 'a'.repeat(64),
  status: 'confirmed',
  ots_download_url: 'https://api.satohash.io/api/stamps/abc?download=true',
  explainer: "Verified against Satohash's own Bitcoin node — block 963545."
}

describe('stateFromVerdict', () => {
  it('confirms only on verified:true', () => {
    expect(stateFromVerdict(ownNodeVerdict)).toBe('confirmed')
  })

  it('treats a bare registry status as pending, never confirmed', () => {
    expect(stateFromVerdict({ verified: false, status: 'confirmed', reason: 'no_proof_stored_yet' })).toBe('not-proven')
  })

  it('reports a not-yet-anchored proof as pending', () => {
    expect(stateFromVerdict({ verified: false, reason: 'no_block_attestation', status: 'pending' })).toBe('pending')
  })

  it('reports a forged proof as not proven', () => {
    expect(stateFromVerdict({ verified: false, reason: 'merkle_root_mismatch' })).toBe('not-proven')
    expect(stateFromVerdict({ verified: false, reason: 'block_does_not_exist' })).toBe('not-proven')
  })
})

describe('HowProofWorks', () => {
  it('renders a chain-resolved verdict with its block height and method', () => {
    render(<HowProofWorks verdict={ownNodeVerdict} />)
    expect(screen.getByTestId('proof-state-badge')).toHaveTextContent(/anchored to bitcoin/i)
    expect(screen.getByTestId('how-proof-works')).toHaveAttribute('data-proof-state', 'confirmed')
    expect(screen.getByText(/963,545|963545/)).toBeInTheDocument()
    expect(screen.getByText(/no third party was trusted/i)).toBeInTheDocument()
  })

  it('names the explorer when the own node could not answer', () => {
    render(
      <HowProofWorks
        verdict={{ ...ownNodeVerdict, verified_method: 'esplora', trust: 'third-party-explorer' }}
      />
    )
    expect(screen.getByText(/public bitcoin explorer/i)).toBeInTheDocument()
  })

  it('shows a pending proof honestly', () => {
    render(<HowProofWorks verdict={{ verified: false, reason: 'no_block_attestation', status: 'pending' }} />)
    expect(screen.getByTestId('proof-state-badge')).toHaveTextContent(/waiting for bitcoin/i)
    expect(screen.getByTestId('how-proof-works')).toHaveAttribute('data-proof-state', 'pending')
    expect(screen.queryByText(/anchored to bitcoin/i)).not.toBeInTheDocument()
  })

  it('never softens a proof that does not resolve', () => {
    render(<HowProofWorks verdict={{ verified: false, reason: 'merkle_root_mismatch', explainer: 'The proof points at a Bitcoin block that does not commit to this file.' }} />)
    expect(screen.getByTestId('proof-state-badge')).toHaveTextContent(/not proven/i)
    expect(screen.getByText(/does not commit to this file/i)).toBeInTheDocument()
  })

  it('always offers the independent verification path', () => {
    render(<HowProofWorks verdict={ownNodeVerdict} variant="full" />)
    expect(screen.getByTestId('independent-verify-command')).toHaveTextContent(/ots verify/)
    expect(screen.getByTestId('ots-download')).toHaveAttribute('href', ownNodeVerdict.ots_download_url)
  })

  it('lets a host site replace every string', () => {
    render(<HowProofWorks variant="compact" labels={{ title: 'Come funziona?', stateConfirmedTitle: 'Ancorato a Bitcoin' }} verdict={ownNodeVerdict} />)
    expect(screen.getByText('Come funziona?')).toBeInTheDocument()
    expect(screen.getByTestId('proof-state-badge')).toHaveTextContent('Ancorato a Bitcoin')
  })
})
