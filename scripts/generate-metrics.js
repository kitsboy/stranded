#!/usr/bin/env node
/**
 * Generates public/metrics.json (gab.product-metrics.v1) for HQ.
 *
 * Runs on prebuild, right after scripts/generate-live-stats.js has written
 * public/data/live-stats.json from the canonical GeoJSON dataset — so the
 * envelope HQ reads is refreshed on every deploy instead of drifting from a
 * hand-curated snapshot (2026-07-21 file claimed top provinces AB 35 / BC 22 /
 * QC 18 while the dataset said AB 45 / ON 17.4 / BC 11.3).
 *
 * Envelope contract (giveabit-ecosystem §3) enforced here:
 *   - typed-number fields health.uptimePct24h / health.latencyMs are OMITTED
 *     when unknown — never JSON null (the schema has no null variant).
 *   - health.status ∈ green|amber|red|unknown
 *   - window.label must match the real refresh cadence.
 *
 * Strategy: public/metrics.json is the editorial base (offers, education,
 * links, curated KPIs). This script only rewrites the values it can actually
 * measure, and records what it touched in raw.buildRefreshed so a reader can
 * tell generated numbers from curated ones.
 *
 * Fail-soft by design: any error leaves the existing file untouched and exits 0
 * so a metrics problem can never break a production build.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIVE_PATH = path.join(ROOT, 'public', 'data', 'live-stats.json');
const METRICS_PATH = path.join(ROOT, 'public', 'metrics.json');
const OFFER_STATUSES = ['ga', 'beta', 'planned', 'internal'];
const HEALTH_STATUSES = ['green', 'amber', 'red', 'unknown'];

function warn(msg) {
  console.warn(`generate-metrics: ${msg}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Canadian province/territory postal codes — the id HQ segments render. */
const PROVINCE_CODE = {
  Alberta: 'AB',
  'British Columbia': 'BC',
  Manitoba: 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nova Scotia': 'NS',
  Nunavut: 'NU',
  Ontario: 'ON',
  'Prince Edward Island': 'PE',
  Quebec: 'QC',
  Saskatchewan: 'SK',
  Yukon: 'YT',
};

function provinceId(name) {
  const clean = String(name || '').trim();
  if (PROVINCE_CODE[clean]) return PROVINCE_CODE[clean];
  const initials = clean
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return initials.length > 1 ? initials : clean.slice(0, 3).toUpperCase();
}

/** Top-N provinces by site count, remainder folded into "Others". */
function provinceRows(provinces, topN = 5) {
  const rows = (provinces || []).slice(0, topN).map((p) => ({
    id: provinceId(p.name),
    label: p.name,
    value: Number(p.count) || 0,
    meta: { share_pct: Number(p.pct) || 0, emission_kg_day: Number(p.emissionKgDay) || 0 },
  }));
  const used = rows.reduce((sum, r) => sum + r.value, 0);
  const total = (provinces || []).reduce((sum, p) => sum + (Number(p.count) || 0), 0);
  if (total > used) {
    rows.push({
      id: 'Others',
      label: 'Others',
      value: total - used,
      meta: { share_pct: Math.round(((total - used) / total) * 1000) / 10 },
    });
  }
  return rows;
}

function kpi(envelope, key) {
  return (envelope.kpis || []).find((k) => k && k.key === key);
}

/** Contract checks. Returns a list of violations (empty === safe to publish). */
function violations(envelope) {
  const out = [];
  const health = envelope.health || {};
  if (!HEALTH_STATUSES.includes(health.status)) {
    out.push(`health.status "${health.status}" not in ${HEALTH_STATUSES.join('|')}`);
  }
  for (const key of ['uptimePct24h', 'latencyMs']) {
    if (key in health && typeof health[key] !== 'number') {
      out.push(`health.${key} must be a number when present (got ${JSON.stringify(health[key])})`);
    }
  }
  for (const offer of envelope.offers || []) {
    if (!OFFER_STATUSES.includes(offer.status)) {
      out.push(`offers[${offer.id}].status "${offer.status}" not in ${OFFER_STATUSES.join('|')}`);
    }
  }
  if (!envelope.productId || !Array.isArray(envelope.kpis)) {
    out.push('productId / kpis missing');
  }
  return out;
}

function main() {
  const live = readJson(LIVE_PATH);
  const envelope = readJson(METRICS_PATH);

  const commit = live.commitShort || (live.commit || '').slice(0, 7);
  const generatedAt = live.generatedAt || new Date().toISOString();
  const siteCount = Number(live.siteCount) || 0;

  envelope.updatedAt = generatedAt;
  envelope.window = {
    label: 'all',
    from: (envelope.window && envelope.window.from) || '2025-01-01T00:00:00Z',
    to: generatedAt,
  };
  envelope.health = envelope.health || {};
  envelope.health.status = siteCount > 0 ? 'green' : 'amber';
  envelope.health.message =
    `Build-refreshed on ${generatedAt} (commit ${commit || 'unknown'}) from public/data/live-stats.json — ` +
    `dataset KPIs (sites mapped, province mix) regenerate on every deploy; curated KPIs ` +
    `(Bitcoin-potential sites, generator catalog, education articles) refresh by hand. ` +
    `No live uptime probe on this static origin, so uptimePct24h/latencyMs are omitted rather than reported as null.`;
  // Contract §3: omit, never null.
  delete envelope.health.latencyMs;
  delete envelope.health.uptimePct24h;

  const sites = kpi(envelope, 'sites_mapped');
  if (sites) {
    sites.value = siteCount;
    sites.hint = 'Verified Canadian stranded energy / methane sites in the public inventory (regenerated from data/stranded-sites-REAL.geojson on every deploy).';
  }

  for (const segment of envelope.segments || []) {
    if (segment && segment.id === 'top_provinces') {
      segment.rows = provinceRows(live.provinces || []);
      segment.label = `Top provinces (site share, ${siteCount} mapped sites)`;
    }
  }

  envelope.raw = envelope.raw || {};
  envelope.raw.buildRefreshed = {
    generatedAt,
    commit: live.commit || null,
    version: live.version || null,
    source: 'public/data/live-stats.json (scripts/generate-live-stats.js on prebuild)',
    refreshedKeys: ['updatedAt', 'window.to', 'health.status', 'health.message', 'kpis.sites_mapped', 'segments.top_provinces'],
    siteCount,
    provinceCount: Number(live.provinceCount) || (live.provinces || []).length,
    withReportedCh4: live.withReportedCh4 || null,
    confidenceHigh: (live.confidenceCounts || {}).high || null,
    ecccReportingYear: live.ecccReportingYear || null,
  };
  if (envelope.raw.staticGroundTruth) {
    envelope.raw.staticGroundTruth.sites_mapped = siteCount;
  }
  envelope.raw.note =
    'Origin /metrics.json for HQ. Dataset KPIs are regenerated at build from public/data/live-stats.json ' +
    '(see raw.buildRefreshed); curated values are hand-maintained. Visitor analytics need public Umami ' +
    '(analytics.giveabit.io → THOR:3002).';

  const bad = violations(envelope);
  if (bad.length) {
    warn(`envelope failed the contract check, keeping the existing file: ${bad.join('; ')}`);
    return;
  }

  fs.writeFileSync(METRICS_PATH, `${JSON.stringify(envelope, null, 2)}\n`);
  console.log(
    `generate-metrics: wrote public/metrics.json (siteCount=${siteCount}, commit=${commit || 'unknown'}, updatedAt=${generatedAt})`,
  );
}

try {
  main();
} catch (err) {
  warn(`failed (${err.message}) — keeping the existing public/metrics.json`);
}
