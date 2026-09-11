import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata = {
  title: 'Open Data — Stranded Value',
  description: 'Public endpoints, ECCC lineage, enrichment license notes — and the published SHA-256 digests you can verify yourself.',
}

type ManifestFile = {
  name: string
  url: string
  bytes: number
  gzipBytes?: number
  sha256: string
}

type Proof = {
  id?: string
  targetSha256?: string
  target?: string
  durable?: boolean
  status?: string
  submittedAt?: string | null
  confirmedAt?: string | null
  bitcoinBlockHeight?: number | null
  verifyUrl?: string | null
  checkedAt?: string | null
  note?: string
}

type Manifest = {
  generatedAt?: string
  dataSnapshotAt?: string | null
  buildId?: string | null
  sha256: string
  dataSha256?: string
  files: ManifestFile[]
  siteCount?: number
  newestReferenceYear?: number | null
  proof?: Proof | null
  snapshotProof?: Proof | null
  proofError?: string | null
  proofHistory?: Proof[]
  verifyInstructions?: string[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Deterministic UTC date — the page is exported at build time, so no locale drift. */
function fmtDate(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtBytes(n?: number): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}

function readManifest(): Manifest | null {
  // Read at build time so the exported HTML always quotes the payload it was built
  // from. Falls back to null (endpoints still listed) if the manifest is absent.
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'dataset-manifest.json')
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest
  } catch {
    return null
  }
}

export default function OpenDataPage() {
  const manifest = readManifest()
  const geo = manifest?.files?.find((f) => f.name === 'stranded-sites-REAL.geojson')
  const live = manifest?.files?.find((f) => f.name === 'live-stats.json')
  const proof = manifest?.proof || null
  const snapshotProof = manifest?.snapshotProof || null
  const confirmedHistory = (manifest?.proofHistory || []).filter(
    (h) => h.status === 'confirmed' && h.bitcoinBlockHeight,
  )[0]

  return (
    <div className="page-container prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Open Data' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Open Data</h1>
      <p className="text-gray-400 not-prose mb-8">Public static endpoints. No auth. Updated on every production build.</p>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <a href="/data/stranded-sites.geojson" download><code>/data/stranded-sites.geojson</code></a>
          {' '}— {manifest ? manifest.siteCount?.toLocaleString('en-CA') : '2,611'} FeatureCollection ·{' '}
          <span className="text-gray-400">
            {manifest ? `${fmtBytes(geo?.bytes)} raw` : 'full dataset'}
          </span>
          {' '}(<a href="/data/stranded-sites.geojson" download className="text-[#5BC0BE]">direct download</a>)
        </li>
        <li>
          <a href="/data/live-stats.json" download><code>/data/live-stats.json</code></a>
          {' '}— aggregates, top sites, value model · <span className="text-gray-400">{manifest ? `${fmtBytes(live?.bytes)} raw` : '~8.5 KB'}</span>
          {' '}(<a href="/data/live-stats.json" download className="text-[#5BC0BE]">direct download</a>)
        </li>
        <li><a href="/status.json"><code>/status.json</code></a> — health + version</li>
      </ul>
      {manifest && (
        <p className="text-xs text-gray-400 not-prose">
          Raw and in-transit sizes, read from the build output: data file {fmtBytes(geo?.bytes)} raw
          {geo?.gzipBytes ? ` (about ${fmtBytes(geo.gzipBytes)} compressed, which is what a browser downloads)` : ''};
          statistics {fmtBytes(live?.bytes)} raw
          {live?.gzipBytes ? ` (about ${fmtBytes(live.gzipBytes)} compressed)` : ''}.
          Sizes change when the data changes — this line is generated at build time, not written by hand.
        </p>
      )}

      {/* ── Verify this yourself ───────────────────────────────────────────── */}
      <section id="verify" className="not-prose my-10 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/[0.05] p-5 sm:p-6">
        <h2 className="text-xl font-bold tracking-tight text-[#5BC0BE]">Verify this yourself</h2>
        <p className="mt-2 text-sm text-gray-300">
          You do not have to take this page&apos;s word for it. Every production build publishes a SHA-256 digest of the
          dataset files, and each digest can be reproduced on your own machine with one command. If the numbers match,
          the bytes you downloaded are the bytes we published.
        </p>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Data file SHA-256 — stranded-sites-REAL.geojson</dt>
            <dd className="mt-1 break-all font-mono text-[11px] sm:text-xs text-[#5BC0BE]">
              {geo?.sha256 || 'not published in this build'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Dataset digest — all published files</dt>
            <dd className="mt-1 break-all font-mono text-[11px] sm:text-xs text-gray-200">
              {manifest?.sha256 || 'not published in this build'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Sites</div>
            <div className="mt-1 font-semibold text-gray-100">{manifest?.siteCount?.toLocaleString('en-CA') ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Newest year</div>
            <div className="mt-1 font-semibold text-gray-100">{manifest?.newestReferenceYear ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Digest published</div>
            <div className="mt-1 font-semibold text-gray-100">{fmtDate(manifest?.generatedAt) ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Data snapshot</div>
            <div className="mt-1 font-semibold text-gray-100">{fmtDate(manifest?.dataSnapshotAt) ?? fmtDate(manifest?.generatedAt) ?? '—'}</div>
          </div>
        </div>

        {/* Timestamp state — never claim a proof we do not have */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#0E1B2A]/40 p-4 text-sm">
          <div className="text-[11px] uppercase tracking-[0.14em] text-gray-400">Timestamp for the data file</div>
          <div className="mt-1">
            {proof && proof.status === 'confirmed' ? (
              <p className="text-gray-200">
                <span className="font-semibold text-[#5BC0BE]">Timestamped on Bitcoin.</span> Block{' '}
                {proof.bitcoinBlockHeight ?? 'unknown'}, confirmed {fmtDate(proof.confirmedAt) || 'on an unrecorded date'}.
                {proof.verifyUrl && (
                  <>
                    {' '}
                    <a href={proof.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] underline">
                      Check the timestamp
                    </a>
                    .{fmtDate(proof.checkedAt) ? ` Status last checked ${fmtDate(proof.checkedAt)}.` : ''}
                  </>
                )}
              </p>
            ) : proof && proof.status ? (
              <p className="text-gray-200">
                <span className="font-semibold text-amber-300">Submitted to Bitcoin — awaiting confirmation.</span> This
                digest was submitted {fmtDate(proof.submittedAt) || 'recently'} and is queued for a Bitcoin block. It is not
                confirmed yet, so we do not call it timestamped.
                {proof.verifyUrl && (
                  <>
                    {' '}
                    <a href={proof.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] underline">
                      Follow the submission
                    </a>
                    .{fmtDate(proof.checkedAt) ? ` Status last checked ${fmtDate(proof.checkedAt)}.` : ''}
                  </>
                )}
              </p>
            ) : manifest?.proofError ? (
              <p className="text-gray-200">
                <span className="font-semibold text-amber-300">Not timestamped.</span> The timestamp service could not be
                reached for this build ({manifest.proofError}). The digests above are still published and still
                reproducible — they are simply not anchored to a Bitcoin block yet.
              </p>
            ) : (
              <p className="text-gray-200">
                <span className="font-semibold text-amber-300">Not yet timestamped.</span> The digest above was published
                {manifest?.generatedAt ? ` ${fmtDate(manifest.generatedAt)}` : ''} and can be verified with the commands
                below. No Bitcoin timestamp has been submitted for it.
              </p>
            )}
          </div>

          <p className="mt-3 border-t border-white/10 pt-3 text-xs text-gray-400">
            The timestamp covers the data file digest, which only changes when the data changes.
            {snapshotProof && snapshotProof.status === 'confirmed' ? (
              <> The whole-snapshot digest of this build is also timestamped on Bitcoin at block {snapshotProof.bitcoinBlockHeight}.</>
            ) : snapshotProof && snapshotProof.status ? (
              <> The whole-snapshot digest of this build was submitted {fmtDate(snapshotProof.submittedAt) || 'recently'} and is awaiting confirmation — it changes on every build, so it is not the durable anchor.</>
            ) : (
              <> The whole-snapshot digest of this build is not timestamped.</>
            )}
          </p>

          {confirmedHistory && (
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-gray-400">
              Earlier published digest{' '}
              <span className="font-mono">{String(confirmedHistory.targetSha256 || '').slice(0, 12)}…</span> was timestamped
              on Bitcoin at block {confirmedHistory.bitcoinBlockHeight} on{' '}
              {fmtDate(confirmedHistory.confirmedAt) || 'an earlier date'} — the timestamp still fixes that version in time.
              {confirmedHistory.verifyUrl && (
                <>
                  {' '}
                  <a href={confirmedHistory.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] underline">
                    Check it
                  </a>
                  .
                </>
              )}
            </p>
          )}
        </div>

        <h3 className="mt-6 text-base font-semibold text-gray-100">Run the check on your own machine</h3>
        <ol className="mt-2 space-y-2 text-sm text-gray-300 list-decimal pl-5">
          <li>Download the files from the endpoint list above (right-click → Save link as).</li>
          <li>
            On macOS, Linux or WSL run{' '}
            <code className="break-all">sha256sum stranded-sites-REAL.geojson</code> — the output must equal{' '}
            <span className="break-all font-mono text-[#5BC0BE]">
              {geo?.sha256 || manifest?.dataSha256 || 'the data-file digest above'}
            </span>
            . This is the digest the Bitcoin timestamp covers.
          </li>
          <li>
            Run <code>sha256sum live-stats.json</code> — it must equal{' '}
            <span className="break-all font-mono text-[#5BC0BE]">{live?.sha256 || 'the statistics-file digest above'}</span>.
          </li>
          <li>
            For the whole-snapshot digest, also download{' '}
            <a href="/data/dataset-canonical-payload.json" download className="text-[#5BC0BE]">dataset-canonical-payload.json</a>{' '}
            and run{' '}
            <code className="break-all">
              cat stranded-sites-REAL.geojson live-stats.json dataset-canonical-payload.json &gt; stranded-payload.bin
            </code>{' '}
            then <code>sha256sum stranded-payload.bin</code>.
          </li>
        </ol>
        <p className="mt-3 text-xs text-gray-400">
          The canonical payload file is a sorted list of file names, sizes and digests with no timestamps in it, so the
          commands above give the same answer on any machine. The data-file digest only moves when the dataset itself
          changes; the whole-snapshot digest moves on every build, because the statistics file is regenerated each time.
        </p>
      </section>

      <h2>Source lineage</h2>
      <p>
        Facility methane reporting: <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer">ECCC open dataset</a>.
        Stranded Score™, genset recommendations, and ROI fields are <strong>model enrichments</strong> by Stranded Value — not government numbers.
      </p>

      <h2>Reuse</h2>
      <p>
        You may use the public JSON for research and non-commercial exploration with attribution:
        “Data: ECCC; enrichments: Stranded Value (stranded.giveabit.io)”.
        Commercial redistribution of the enriched pack: contact <a href="mailto:hello@giveabit.io">hello@giveabit.io</a>.
      </p>

      <h2>GeoJSON schema (Feature properties)</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-white/10 my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Field</th>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {[
              ['ghgrp_id', 'string', 'ECCC facility identifier (primary key)'],
              ['name', 'string', 'Facility / site name'],
              ['company', 'string', 'Reporting organization'],
              ['province', 'string', 'Canadian province or territory'],
              ['city', 'string', 'Nearest municipality (if reported)'],
              ['emission_rate_kg_day', 'number', 'Daily methane vent rate (kg CH₄/day)'],
              ['ch4_tonnes_year', 'number', 'Annual methane (tonnes)'],
              ['source_type', 'string', 'Industrial category (oil_gas_extraction, landfill_waste, …)'],
              ['confidence', 'string', 'Data quality: high | medium | low'],
              ['reference_year', 'number', 'Reporting year from ECCC filing'],
              ['distance_to_grid_km', 'number?', 'Grid tie distance — often null (inferred in Score v3)'],
              ['internet_type', 'string?', 'Connectivity class — often null (inferred in Score v3)'],
              ['geometry.coordinates', '[lng, lat]', 'WGS84 point location'],
            ].map(([field, type, desc]) => (
              <tr key={field} className="border-b border-white/5">
                <td className="p-3 font-mono text-[#5BC0BE] text-xs">{field}</td>
                <td className="p-3 text-xs text-gray-400">{type}</td>
                <td className="p-3 text-xs">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Stranded enrichments (score, genset, ROI) are computed client-side and in <code>live-stats.json</code> aggregates — not in the raw GeoJSON export.</p>
      <p>See <Link href="/docs/api">API docs</Link> and <Link href="/methodology">methodology</Link> for score factors and inferred fields.</p>
    </div>
  )
}
