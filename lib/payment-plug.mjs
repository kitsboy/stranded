/**
 * stranded fake payment plug. Demo only. Own wallet and own UTXO set.
 * Speaks createIntent / getStatus / listEvents. No node call.
 * The browser must not mark a payment paid.
 */
import { createFakePlug } from './family-payment-core.mjs';

export const paymentPlug = createFakePlug('stranded');
