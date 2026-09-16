'use client'

/**
 * The pin-proof store, as a React hook.
 *
 * One fetch per page load, shared by every pin and every proof surface — the
 * map HUD chip, the hover teaser and the site panel all read the same snapshot,
 * so they can never disagree about whether the pins are anchored.
 */
import { useEffect, useSyncExternalStore } from 'react'
import {
  EMPTY_PIN_PROOF,
  getPinProof,
  loadPinProof,
  subscribePinProof,
  type PinProof,
} from '@/lib/pin-proof'

export function usePinProof(): PinProof {
  const proof = useSyncExternalStore(subscribePinProof, getPinProof, () => EMPTY_PIN_PROOF)
  useEffect(() => {
    void loadPinProof()
  }, [])
  return proof
}
