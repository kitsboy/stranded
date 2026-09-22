/**
 * Family Payment Core — portable fake plug.
 *
 * Same file on every product. A new service is one new row in INCOME_STREAMS.
 * Never reuse a prefix, wallet id, or UTXO set.
 *
 * This plug is fake. It does not call LND, BTCPay, LNbits, Umbrel, or any node.
 * Every intent is demo. The browser cannot mark it paid.
 *
 * When a real node is attached later, walletId and utxoSet map to that node's
 * own wallet: LNbits wallet, BTCPay store label, LND account, or Core wallet
 * label. Demo labels must never land in a live UTXO set.
 *
 * Keep this file identical across repos. Canonical copy lives in Katoa.
 */

export const INCOME_STREAMS = {
  giveabit: { prefix: 'ga', walletId: 'giveabit_main', utxoSet: 'utxo:giveabit', plug: 'lnaddress', receives: true },
  satohash: { prefix: 'sh', walletId: 'satohash', utxoSet: 'utxo:satohash', plug: 'satohash', receives: true },
  stranded: { prefix: 'sd', walletId: 'stranded', utxoSet: 'utxo:stranded', plug: 'lnaddress', receives: true },
  sherpacarta: { prefix: 'sc', walletId: 'sherpacarta', utxoSet: 'utxo:sherpacarta', plug: 'lnaddress', receives: true },
  openstrata: { prefix: 'os', walletId: 'openstrata', utxoSet: 'utxo:openstrata', plug: 'lnaddress', receives: true },
  tadbuy: { prefix: 'tb', walletId: 'tadbuy', utxoSet: 'utxo:tadbuy', plug: 'lnaddress', receives: true },
  katoa: { prefix: 'ka', walletId: 'katoa', utxoSet: 'utxo:katoa', plug: 'btcpay', receives: true },
  motopass: { prefix: 'mp', walletId: 'motopass', utxoSet: 'utxo:motopass', plug: 'lnaddress', receives: true },
  hq: { prefix: 'hq', walletId: null, utxoSet: null, plug: null, receives: false },
  admin: { prefix: 'ad', walletId: null, utxoSet: null, plug: null, receives: false },
};

const KIND_CODES = {
  gift: 'g',
  subscription: 's',
  donation: 'd',
  merch: 'm',
  internal: 'i',
};

export function assertUniqueIncomeStreams() {
  const wallets = new Set();
  const utxoSets = new Set();
  const prefixes = new Set();
  for (const [site, row] of Object.entries(INCOME_STREAMS)) {
    if (prefixes.has(row.prefix)) throw new Error(`Prefix reused: ${row.prefix}`);
    prefixes.add(row.prefix);
    if (!row.receives) continue;
    if (!row.walletId || !row.utxoSet) {
      throw new Error(`${site} is marked receiving but has no wallet or UTXO set`);
    }
    if (wallets.has(row.walletId)) throw new Error(`Wallet reused: ${row.walletId}`);
    if (utxoSets.has(row.utxoSet)) throw new Error(`UTXO set reused: ${row.utxoSet}`);
    wallets.add(row.walletId);
    utxoSets.add(row.utxoSet);
  }
}

export function referenceCodeFor({ site, kind = 'donation', seq = 1, demo = true }) {
  const row = INCOME_STREAMS[site];
  if (!row) throw new Error(`Unknown site: ${site}`);
  const kindCode = KIND_CODES[kind] || 'x';
  const n = String(seq).padStart(6, '0');
  const base = `${row.prefix}-${kindCode}-${n}`;
  return demo ? `${base}-demo` : base;
}

export function paymentLabel(input) {
  const code = referenceCodeFor(input);
  const name = String(input.site).toUpperCase();
  return input.demo === false ? `${name} ${code}` : `${name}-DEMO ${code}`;
}

function streamFor(site) {
  const row = INCOME_STREAMS[site];
  if (!row) throw new Error(`Unknown site: ${site}`);
  if (!row.receives) throw new Error(`${site} does not receive payments`);
  return row;
}

/**
 * Fake plug for one site. Speaks createIntent / getStatus / listEvents.
 * Always demo. settleForFixture is a test hook, not a browser "mark paid".
 */
export function createFakePlug(site) {
  const stream = streamFor(site);
  const intents = new Map();
  const events = [];
  let seq = 0;

  function requireIntent(id) {
    const intent = intents.get(id);
    if (!intent) throw new Error(`Unknown payment intent: ${id}`);
    return intent;
  }

  return {
    name: stream.plug,
    site,
    walletId: stream.walletId,
    utxoSet: stream.utxoSet,
    mode: 'demo',

    async createIntent({ amountSats, memo, metadata = {}, rail = 'lightning', kind = 'donation' }) {
      if (!Number.isInteger(amountSats) || amountSats <= 0) {
        throw new Error('amountSats must be a positive integer');
      }
      seq += 1;
      const reference = referenceCodeFor({ site, kind, seq, demo: true });
      const label = paymentLabel({ site, kind, seq, demo: true });
      const id = `fake-${stream.plug}-${site}-${reference}`;
      const intent = {
        id,
        amountSats,
        memo,
        rail,
        provider: stream.plug,
        state: 'pending',
        createdAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          site,
          reference,
          label,
          walletId: stream.walletId,
          utxoSet: stream.utxoSet,
          mode: 'demo',
        },
      };
      intents.set(id, intent);
      events.push({
        id: `evt-${id}-created`,
        intentId: id,
        provider: stream.plug,
        type: 'Created',
        state: 'pending',
        amountSats,
        receivedAt: intent.createdAt,
      });
      return intent;
    },

    async getStatus(id) {
      return requireIntent(id);
    },

    async listEvents(id) {
      requireIntent(id);
      return events.filter((event) => event.intentId === id);
    },

    /** Test hook only. A page must never call this to mark a payment paid. */
    async settleForFixture(id) {
      const current = requireIntent(id);
      if (current.metadata.mode !== 'demo') throw new Error('Fixture settle refused: not demo');
      let next = current;
      if (current.rail === 'onchain' && current.state !== 'confirming') {
        next = { ...current, state: 'confirming' };
        intents.set(id, next);
        events.push({
          id: `evt-${id}-confirming`,
          intentId: id,
          provider: stream.plug,
          type: 'TransactionDetected',
          state: 'confirming',
          amountSats: current.amountSats,
          receivedAt: new Date().toISOString(),
        });
      }
      const settled = { ...next, state: 'settled' };
      intents.set(id, settled);
      events.push({
        id: `evt-${id}-settled`,
        intentId: id,
        provider: stream.plug,
        type: 'Settled',
        state: 'settled',
        amountSats: current.amountSats,
        receivedAt: new Date().toISOString(),
      });
      return settled;
    },
  };
}
