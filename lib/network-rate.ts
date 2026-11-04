/**
 * Bitcoin network rate from mempool.space, which reads the public chain.
 * Hashprice is the bitcoin paid in a real block window, spread over the
 * hours that window actually took, divided by the hashrate mempool reports.
 */

export type NetworkWindow = {
  hashrateHs: number
  totalRewardSats: number
  totalFeeSats: number
  startUnix: number
  endUnix: number
  checkedAt: string
}

export type NetworkRate = {
  seconds: number
  rewardBtc: number
  feeBtc: number
  btcPerDay: number
  hashrateTh: number
  ehPerS: number
  btcPerThDay: number
}

const MEMPOOL = 'https://mempool.space'

export function networkRate(window: NetworkWindow): NetworkRate | null {
  const seconds = window.endUnix - window.startUnix
  if (!(window.hashrateHs > 0) || !(seconds > 0) || !(window.totalRewardSats > 0)) return null
  const rewardBtc = window.totalRewardSats / 1e8
  const feeBtc = Math.max(0, window.totalFeeSats) / 1e8
  const btcPerDay = rewardBtc * (86400 / seconds)
  const hashrateTh = window.hashrateHs / 1e12
  if (!(hashrateTh > 0)) return null
  return {
    seconds,
    rewardBtc,
    feeBtc,
    btcPerDay,
    hashrateTh,
    ehPerS: window.hashrateHs / 1e18,
    btcPerThDay: btcPerDay / hashrateTh,
  }
}

async function readJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

export async function fetchNetworkWindow(signal?: AbortSignal): Promise<NetworkWindow | null> {
  try {
    const [hashBody, rewardBody] = await Promise.all([
      readJson(`${MEMPOOL}/api/v1/mining/hashrate/3d`, signal),
      readJson(`${MEMPOOL}/api/v1/mining/reward-stats/144`, signal),
    ])
    const hash = hashBody as { currentHashrate?: number }
    const reward = rewardBody as { startBlock?: number; endBlock?: number; totalReward?: string; totalFee?: string }
    const hashrateHs = Number(hash.currentHashrate)
    const startBlock = Number(reward.startBlock)
    const endBlock = Number(reward.endBlock)
    const totalRewardSats = Number(reward.totalReward)
    const totalFeeSats = Number(reward.totalFee)
    if (!(hashrateHs > 0) || !(startBlock > 0) || !(endBlock > startBlock) || !(totalRewardSats > 0)) return null
    const [startHashRes, endHashRes] = await Promise.all([
      fetch(`${MEMPOOL}/api/block-height/${startBlock}`, { signal }),
      fetch(`${MEMPOOL}/api/block-height/${endBlock}`, { signal }),
    ])
    if (!startHashRes.ok || !endHashRes.ok) return null
    const startHash = (await startHashRes.text()).trim()
    const endHash = (await endHashRes.text()).trim()
    const [startBlockBody, endBlockBody] = await Promise.all([
      readJson(`${MEMPOOL}/api/block/${startHash}`, signal),
      readJson(`${MEMPOOL}/api/block/${endHash}`, signal),
    ])
    const startUnix = Number((startBlockBody as { timestamp?: number }).timestamp)
    const endUnix = Number((endBlockBody as { timestamp?: number }).timestamp)
    if (!(endUnix > startUnix)) return null
    return {
      hashrateHs,
      totalRewardSats,
      totalFeeSats: Number.isFinite(totalFeeSats) ? totalFeeSats : 0,
      startUnix,
      endUnix,
      checkedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
