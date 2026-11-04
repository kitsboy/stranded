/**
 * Biggest-sites-first slice of reported Environment and Climate Change Canada methane.
 * The rows come from the GHGRP file. This function does not invent kilograms.
 */

export type CaptureRow = {
  kg: number
  /** Kilograms per day Ottawa marked as vented. Null when that filing has no split. */
  vented: number | null
  flared: number | null
  /** True only when the Emissions-by-Source file published a vent or flare figure. */
  split: boolean
}

export type MethaneSlice = {
  /** Requested share, 0 to 1. */
  share: number
  totalKg: number
  kg: number
  sites: number
  /** Actual share after whole sites are included. A site is not cut in half. */
  actualShare: number
  ventedKg: number
  flaredKg: number
  /**
   * Reported methane at sites that do publish a vent/flare split, minus those
   * two columns. It is still in the facility total. It is not vented and it
   * is not flared.
   */
  otherKg: number
  noSplitKg: number
}

export function sliceTopMethane(rows: CaptureRow[], sharePercent: number): MethaneSlice {
  const share = Math.min(100, Math.max(0, sharePercent)) / 100
  const sorted = rows.filter((row) => row.kg > 0).sort((a, b) => b.kg - a.kg)
  const totalKg = sorted.reduce((sum, row) => sum + row.kg, 0)
  const target = totalKg * share
  let kg = 0
  let sites = 0
  let ventedKg = 0
  let flaredKg = 0
  let otherKg = 0
  let noSplitKg = 0
  if (share > 0 && totalKg > 0) {
    for (const row of sorted) {
      kg += row.kg
      sites += 1
      if (row.split) {
        const vented = row.vented && row.vented > 0 ? row.vented : 0
        const flared = row.flared && row.flared > 0 ? row.flared : 0
        ventedKg += vented
        flaredKg += flared
        const rest = row.kg - vented - flared
        if (rest > 0) otherKg += rest
      } else {
        noSplitKg += row.kg
      }
      if (kg >= target) break
    }
  }
  return {
    share,
    totalKg,
    kg,
    sites,
    actualShare: totalKg > 0 ? kg / totalKg : 0,
    ventedKg,
    flaredKg,
    otherKg,
    noSplitKg,
  }
}
