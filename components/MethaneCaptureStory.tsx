'use client'

import { useEffect, useMemo, useState } from 'react'
import { ASIC_MACHINES } from '@/lib/fleet-template'
import { sliceTopMethane, type CaptureRow } from '@/lib/methane-capture'
import { fetchNetworkWindow, networkRate, type NetworkRate, type NetworkWindow } from '@/lib/network-rate'
import { computeGeneratorPower } from '@/lib/sites'
import { energyMinerCeiling } from '@/lib/energy-build'
import { useBtcPrice } from '@/components/BtcPriceProvider'

type CaptureFile = {
  source?: string
  newestReferenceYear?: number | null
  sitesWithMethane?: number
  rows?: CaptureRow[]
}

const PRESETS = [10, 30, 80]

function tonnes(kg: number): string {
  const t = kg / 1000
  if (t >= 100) return `${Math.round(t).toLocaleString('en-CA')} tonnes`
  return `${t.toLocaleString('en-CA', { maximumFractionDigits: 1 })} tonnes`
}

function btcText(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 100) return n.toLocaleString('en-CA', { maximumFractionDigits: 0 })
  if (n >= 1) return n.toLocaleString('en-CA', { maximumFractionDigits: 2 })
  if (n >= 0.01) return n.toLocaleString('en-CA', { maximumFractionDigits: 4 })
  return n.toLocaleString('en-CA', { maximumFractionDigits: 6 })
}

function usdText(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('en-CA', { maximumFractionDigits: 2 })} million`
  return `$${Math.round(n).toLocaleString('en-CA')}`
}

function checkedLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  })
}

/** Hashrate in the same family of units the public network is quoted in. */
function workText(terahash: number): string {
  const eh = terahash / 1_000_000
  if (eh >= 1) return `${eh.toLocaleString('en-CA', { maximumFractionDigits: 2 })} exahash per second`
  const ph = terahash / 1_000
  if (ph >= 1) return `${ph.toLocaleString('en-CA', { maximumFractionDigits: 1 })} petahash per second`
  return `${Math.round(terahash).toLocaleString('en-CA')} terahash per second`
}

function machinesFor(kg: number, watts: number, hashrateTh: number) {
  const powerKw = computeGeneratorPower(kg)
  const count = energyMinerCeiling(powerKw, watts)
  return { powerKw, count, hashrateTh: count * hashrateTh }
}

export default function MethaneCaptureStory() {
  const { usd, stale } = useBtcPrice()
  const [file, setFile] = useState<CaptureFile | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [share, setShare] = useState(10)
  const [asicId, setAsicId] = useState(ASIC_MACHINES[0].id)
  const [network, setNetwork] = useState<NetworkWindow | null>(null)
  const [networkState, setNetworkState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    fetch('/data/methane-capture.json')
      .then((res) => {
        if (!res.ok) throw new Error('capture')
        return res.json()
      })
      .then((data: CaptureFile) => setFile(data))
      .catch(() => setLoadError(true))
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    fetchNetworkWindow(ac.signal).then((window) => {
      if (ac.signal.aborted) return
      if (window && networkRate(window)) {
        setNetwork(window)
        setNetworkState('ready')
      } else {
        setNetworkState('error')
      }
    })
    return () => ac.abort()
  }, [])

  const asic = ASIC_MACHINES.find((machine) => machine.id === asicId) || ASIC_MACHINES[0]
  const rate: NetworkRate | null = network ? networkRate(network) : null
  const slice = useMemo(
    () => sliceTopMethane(file?.rows || [], share),
    [file, share],
  )
  const build = machinesFor(slice.kg, asic.power_w, asic.hashrate_ths)
  const ventedBuild = machinesFor(slice.ventedKg, asic.power_w, asic.hashrate_ths)
  const dailyBtc = rate ? build.hashrateTh * rate.btcPerThDay : null
  const ventedBtc = rate ? ventedBuild.hashrateTh * rate.btcPerThDay : null
  const networkShare = rate && rate.hashrateTh > 0 ? (build.hashrateTh / rate.hashrateTh) * 100 : null
  const perMachineBtc = rate ? asic.hashrate_ths * rate.btcPerThDay : null
  const perMachineSats = perMachineBtc != null ? perMachineBtc * 1e8 : null

  return (
    <section className="w-full py-10" data-testid="methane-capture" aria-labelledby="methane-capture-heading">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#5BC0BE]">Federal methane reports</p>
      <h2 id="methane-capture-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">
        How much bitcoin are we missing?
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-300">
        Large facilities in Canada report their methane to the federal government. The biggest reports hold most of the gas.
        Take the top of that gas, pick a real mining machine, and see what it would earn if the gas made electricity
        instead of leaving the site.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              data-testid={`methane-capture-preset-${preset}`}
              aria-pressed={share === preset}
              onClick={() => setShare(preset)}
              className={`min-h-[44px] rounded-full px-4 text-sm font-semibold ${share === preset ? 'bg-[#FF8C00] text-[#1e293b]' : 'border border-white/15 text-gray-200'}`}
            >
              Top {preset}%
            </button>
          ))}
        </div>
        <label className="mt-4 flex flex-wrap items-baseline justify-between gap-2 text-sm text-gray-300" htmlFor="methane-capture-range">
          <span>Share of reported methane, biggest sites first</span>
          <span className="font-semibold text-white">{share}%</span>
        </label>
        <input
          id="methane-capture-range"
          data-testid="methane-capture-range"
          type="range"
          min={1}
          max={100}
          value={share}
          onChange={(event) => setShare(Number(event.target.value))}
          className="mt-3 h-11 w-full accent-[#FF8C00]"
        />
        <p className="text-xs leading-relaxed text-gray-500">
          The bar does not cut a site in half. It keeps adding the next-biggest report until the share is reached, so the real share can be a little over the number you picked.
        </p>

        <label className="mt-5 block text-sm text-gray-300" htmlFor="methane-capture-asic">
          Mining machine
        </label>
        <select
          id="methane-capture-asic"
          data-testid="methane-capture-asic"
          value={asic.id}
          onChange={(event) => setAsicId(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-3 text-sm text-white"
        >
          {ASIC_MACHINES.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.name} — {machine.hashrate_ths} TH/s, {machine.power_w.toLocaleString('en-CA')} W, {machine.efficiency_j_th} J/TH
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          {asic.manufacturer} {asic.name}. It does {asic.hashrate_ths.toLocaleString('en-CA')} terahash per second, which is {asic.hashrate_ths.toLocaleString('en-CA')} trillion tries a second.
          It draws {asic.power_w.toLocaleString('en-CA')} watts.
          {' '}{asic.efficiency_j_th} joules per terahash is how much electricity each unit of that work uses. A lower number is a more efficient machine.
          Same machine card as the rest of this site.
        </p>

        {loadError && <p className="mt-4 text-sm text-red-300">The methane file did not load, so these figures are not shown.</p>}
        {!file && !loadError && <p className="mt-4 text-sm text-gray-400">Loading the federal methane file…</p>}

        {file && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/10 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-[#FF8C00]">If this reported gas ran generators</p>
              {dailyBtc == null ? (
                <p className="mt-2 text-sm text-gray-200" data-testid="methane-capture-btc">
                  {networkState === 'loading' ? 'Checking the public Bitcoin network…' : 'The live network check did not answer, so no bitcoin figure is shown.'}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-3xl font-bold text-white sm:text-4xl" data-testid="methane-capture-btc">
                    {btcText(dailyBtc)} bitcoin a day
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-200">
                    About {btcText(dailyBtc * 365)} bitcoin a year, before pool fees, generators, permits, and downtime.
                    {networkShare != null ? ` Together these machines are ${networkShare.toLocaleString('en-CA', { maximumFractionDigits: 2 })}% of every miner on earth.` : ''}
                    {!stale && usd > 0 ? ` At today’s bitcoin price that is about ${usdText(dailyBtc * usd)} a day, before those costs.` : ''}
                  </p>
                  {perMachineSats != null && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-300">
                      One {asic.name} earns about {Math.round(perMachineSats).toLocaleString('en-CA')} satoshis a day on this network.
                      A satoshi is one hundred-millionth of a bitcoin. The total above is that share times every machine the gas can power.
                    </p>
                  )}
                </>
              )}
            </article>

            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Gas in this slice</p>
              <p className="mt-1 text-2xl font-bold text-white" data-testid="methane-capture-gas">{tonnes(slice.kg)} a day</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                {slice.sites.toLocaleString('en-CA')} sites. That is {(slice.actualShare * 100).toLocaleString('en-CA', { maximumFractionDigits: 1 })}% of the reported methane, because a site is kept whole.
              </p>
            </article>
            <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Mining work that power can run</p>
              <p className="mt-1 text-2xl font-bold text-white">{workText(build.hashrateTh)}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                {(build.powerKw / 1000).toLocaleString('en-CA', { maximumFractionDigits: 1 })} MW of average electricity.
                That fits {build.count.toLocaleString('en-CA')} {asic.name} machines.
                Hashrate is how much work those machines do. A bigger share of the world’s work means a bigger share of the new coins.
              </p>
            </article>
          </div>
        )}

        {file && (
          <div className="mt-4 rounded-xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/10 p-4 text-sm leading-relaxed text-gray-200" data-testid="methane-capture-vented">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5BC0BE]">The part that goes into the air</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><span className="font-semibold text-white">{tonnes(slice.ventedKg)} a day</span> is marked vented: released, not burned. This is the into-the-air number.</li>
              <li><span className="font-semibold text-white">{tonnes(slice.flaredKg)} a day</span> is marked flared: already burned at the site.</li>
              <li><span className="font-semibold text-white">{tonnes(slice.otherKg)} a day</span> is other methane in reports that do publish those two columns. It is not in either column, so it is not called evaporation.</li>
              <li><span className="font-semibold text-white">{tonnes(slice.noSplitKg)} a day</span> has no vent-or-flare split. Many landfills report that way. That gas is not called evaporation either.</li>
            </ul>
            {ventedBtc != null && (
              <p className="mt-2">
                The vented part alone, burned in generators instead of released, would earn about <span className="font-semibold text-white">{btcText(ventedBtc)} bitcoin a day</span>.
                That is the published unburned gas in this slice.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 text-sm leading-relaxed text-gray-400" data-testid="methane-capture-network">
          {rate && network ? (
            <p>
              The whole Bitcoin network is working at <span className="text-white">{rate.ehPerS.toLocaleString('en-CA', { maximumFractionDigits: 1 })} exahash per second</span>.
              One exahash is a million terahash, so you can compare the network with the machines above.
              The last 144 blocks paid {rate.rewardBtc.toLocaleString('en-CA', { maximumFractionDigits: 2 })} bitcoin
              over {(rate.seconds / 3600).toLocaleString('en-CA', { maximumFractionDigits: 1 })} hours, including {rate.feeBtc.toLocaleString('en-CA', { maximumFractionDigits: 2 })} bitcoin in fees.
              That pay, divided by that work, is the rate behind the bitcoin figures above.
              <span className="text-white"> Checked {checkedLabel(network.checkedAt)}</span> from mempool.space, which reads the public chain.
              A harder network means each machine earns less, because they share the same new coins.
            </p>
          ) : (
            <p>{networkState === 'loading' ? 'Checking mempool.space for today’s network rate…' : 'mempool.space did not answer. The hashrate and the bitcoin figure stay blank. An old guess is not used.'}</p>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Source: {file?.source || 'Environment and Climate Change Canada, Greenhouse Gas Reporting Program'}
          {file?.newestReferenceYear ? `. Newest filing year in the file: ${file.newestReferenceYear}. Some facilities last reported earlier. A newer year is not invented.` : ''}
          {' '}Electricity uses the same generator rule as each site card: a Jenbacher-class engine at 90% of its listed power, averaged over the day, because the report is a daily amount.
          Bitcoin is gross earnings at the network rate above. It is not profit, and it is not the higher optimistic rate on older payback cards.
          Reported methane is not a pipe already built.
        </p>
      </div>
    </section>
  )
}
