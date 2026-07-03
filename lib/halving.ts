export type HalvingEvent = { date: string; block: number; rewardBtc: number }

export const HALVING_SCHEDULE: HalvingEvent[] = [
  { date: '2012-11-28', block: 210000, rewardBtc: 25 },
  { date: '2016-07-09', block: 420000, rewardBtc: 12.5 },
  { date: '2020-05-11', block: 630000, rewardBtc: 6.25 },
  { date: '2024-04-20', block: 840000, rewardBtc: 3.125 },
  { date: '2028-04-15', block: 1050000, rewardBtc: 1.5625 },
  { date: '2032-04-10', block: 1260000, rewardBtc: 0.78125 },
]

export function rewardAtYear(baseYear = 2026, yearsAhead: number): number {
  const target = baseYear + yearsAhead
  let reward = 3.125
  for (const h of HALVING_SCHEDULE) {
    const y = parseInt(h.date.slice(0, 4), 10)
    if (y <= target) reward = h.rewardBtc
  }
  return reward
}

export function projectBtcRevenue(
  dailyBtcAtCurrentReward: number,
  years = 10,
  startYear = 2026
): { year: number; dailyBtc: number; annualBtc: number; halvingFactor: number }[] {
  const baseReward = 3.125
  return Array.from({ length: years }, (_, i) => {
    const year = startYear + i
    const reward = rewardAtYear(startYear, i)
    const factor = reward / baseReward
    const dailyBtc = dailyBtcAtCurrentReward * factor
    return { year, dailyBtc, annualBtc: dailyBtc * 365, halvingFactor: factor }
  })
}