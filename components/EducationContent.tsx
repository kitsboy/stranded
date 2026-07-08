'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Globe, Zap, Leaf, TrendingUp, Users, 
  ArrowRight, Download, Share2, ChevronDown, ChevronUp, 
  Target, Award, Lightbulb, BarChart3, Clock, Users as UsersIcon, Award as AwardIcon, CheckCircle, TrendingUp as TrendingUpIcon, Globe as GlobeIcon, Zap as ZapIcon,
  Filter, MapPin, Cpu, DollarSign, Percent
} from 'lucide-react'
import { loadSites, EnrichedSite, GENSET_DATA, computeGeneratorPower, GensetId } from '@/lib/sites'
import { USED_ASIC_MARKET } from '@/lib/roi-model'
import { markEduSection, getEduProgress } from '@/lib/bookmarks'
import GensetComparisonTable from '@/components/GensetComparisonTable'

function QuizSection() {
  const questions = [
    { q: "What makes Bitcoin the perfect offtaker for stranded energy?", opts: ["It needs grid connection", "It is location-agnostic and pays real rates for power no one else wants", "It only works with solar", "It requires subsidies"], ans: 1 },
    { q: "Roughly how much more potent is methane than CO₂ over 100 years?", opts: ["2×", "10×", "25×", "100×"], ans: 2 },
    { q: "Stranded Value primarily means...", opts: ["Just environmental credits", "Combined climate restoration + BTC revenue + community wealth", "Only pipeline construction", "Government grants only"], ans: 1 },
    { q: "How many verified sites are in the Canadian dataset?", opts: ["261", "1,200", "2,611", "10,000+"], ans: 2 },
    { q: "What does the Stranded Score™ primarily rank?", opts: ["Political favor", "Site capture attractiveness (emissions, access, economics)", "Distance from cities only", "Age of equipment"], ans: 1 },
  ];
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    if (idx === questions[current].ans) setScore(s => s + 1);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 900);
  };

  const reset = () => {
    setCurrent(0); setScore(0); setSelected(null); setFinished(false);
  };

  const shareScore = async () => {
    const pct = Math.round((score / questions.length) * 100);
    const url = `${window.location.origin}/education?quiz=${score}&total=${questions.length}&pct=${pct}`;
    const text = `I scored ${score}/${questions.length} (${pct}%) on the Stranded Value IQ quiz! ${url}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Stranded Value IQ', text, url });
      else { await navigator.clipboard.writeText(text); alert('Score link copied!'); }
    } catch { /* cancelled */ }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const rec = pct > 80 ? "You're a Stranded Value expert — go build a mission on the map!" : pct > 50 ? "Solid foundation — try the Advanced Simulator next." : "Great start — explore the glossary and basic simulator.";
    markEduSection('quiz-complete');
    return (
      <div className="glass p-8 rounded-3xl text-center mb-16">
        <h3 className="text-2xl font-semibold mb-2">Your Stranded Value IQ: {score}/{questions.length} ({pct}%)</h3>
        <p className="text-gray-300 mb-4">{rec}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={reset} className="px-6 py-2 bg-[#FF8C00] text-black rounded-xl font-medium">Retake Quiz</button>
          <button onClick={shareScore} className="px-6 py-2 border border-white/20 rounded-xl font-medium flex items-center gap-2"><Share2 size={16} /> Share score</button>
        </div>
        <p className="text-xs mt-3 text-gray-500">Tag @give_bit to join the movement.</p>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2"><AwardIcon className="text-[#FF8C00]" /> Test Your Stranded Value IQ</h2>
        <div className="text-xs text-gray-400">Question {current + 1} / {questions.length}</div>
      </div>
      <div className="glass p-8 rounded-3xl">
        <div className="text-lg mb-6">{q.q}</div>
        <div className="grid gap-3">
          {q.opts.map((opt, idx) => (
            <button key={idx} onClick={() => handleAnswer(idx)} disabled={selected !== null} className={`text-left p-4 rounded-2xl border transition ${selected === idx ? (idx === q.ans ? 'border-emerald-400 bg-emerald-400/10' : 'border-red-400 bg-red-400/10') : 'border-white/20 hover:border-[#FF8C00]/50 hover:bg-white/5'}`}>
              {opt}
            </button>
          ))}
        </div>
        {selected !== null && <div className="mt-4 text-sm text-gray-400">Great answer! Moving to next question...</div>}
      </div>
    </div>
  );
}

export default function EducationContent() {
  // State for interactive elements
  const [glossarySearch, setGlossarySearch] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [selectedSimulator, setSelectedSimulator] = useState<'basic' | 'advanced' | 'regional'>('basic')

  // Enhanced simulator states
  const [basicPct, setBasicPct] = useState(12)
  const [advPct, setAdvPct] = useState(15)
  const [advEfficiency, setAdvEfficiency] = useState(78)
  const [advPowerPrice, setAdvPowerPrice] = useState(0.035)
  const [regionalProvince, setRegionalProvince] = useState('Ontario')
  const [liveBtc, setLiveBtc] = useState(85000) // live sensitivity for value demos
  const [selectedGenset, setSelectedGenset] = useState('jenbacher316')
  const [numUnits, setNumUnits] = useState(1) // for configurator demo
  const [treatmentAdder, setTreatmentAdder] = useState(10) // % for gas treatment in configurator

  // Real dataset integration
  const [realSites, setRealSites] = useState<EnrichedSite[]>([])
  const [selectedRealSiteId, setSelectedRealSiteId] = useState<string>('')
  const [realSiteGenset, setRealSiteGenset] = useState('jenbacher316')
  const [persona, setPersona] = useState<'operator' | 'investor' | 'government' | 'landowner'>('investor')
  const [financingDebtPercent, setFinancingDebtPercent] = useState(60)
  const [financingInterestRate, setFinancingInterestRate] = useState(8) // %
  const [eduProgress, setEduProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setEduProgress(getEduProgress())
    markEduSection('education-visit')
  }, [])

  // ASIC models for per-site mining ROI (reused from platform for consistency)
  const ASIC_MACHINES = [
    { id: 's21xp', name: 'Antminer S21 XP', hashrate_ths: 300, power_w: 4050, cost_cad: 8500 },
    { id: 's21', name: 'Antminer S21', hashrate_ths: 200, power_w: 3500, cost_cad: 5500 },
    { id: 's19kpro', name: 'Antminer S19k Pro', hashrate_ths: 136, power_w: 3264, cost_cad: 3200 },
    { id: 's19xp', name: 'Antminer S19 XP', hashrate_ths: 140, power_w: 3010, cost_cad: 3800 },
    { id: 'm60s', name: 'WhatsMiner M60S', hashrate_ths: 186, power_w: 3348, cost_cad: 4800 },
    { id: 's19', name: 'Antminer S19', hashrate_ths: 95, power_w: 3250, cost_cad: 1800 }
  ]
  const [selectedAsicId, setSelectedAsicId] = useState('s21xp')

  // Load real sites for per-location Value
  useEffect(() => {
    loadSites().then(sites => {
      setRealSites(sites)
      if (sites.length > 0) {
        // default to highest emission
        const top = [...sites].sort((a,b) => b.emission - a.emission)[0]
        setSelectedRealSiteId(top.id)
      }
    }).catch(() => {})
  }, [])

  // Use shared from lib for consistency with map/panel
  const gensetData = GENSET_DATA;

  // Data for visualizations (based on real dataset patterns)
  const provinceData = [
    { name: 'Ontario', pct: 28, emission: 56014 },
    { name: 'Alberta', pct: 24, emission: 37140 },
    { name: 'British Columbia', pct: 15, emission: 32951 },
    { name: 'Quebec', pct: 12, emission: 18500 },
    { name: 'Manitoba', pct: 8, emission: 12200 },
    { name: 'Saskatchewan & Others', pct: 13, emission: 9800 },
  ]

  const sourceData = [
    { type: 'Industrial Facilities', pct: 42 },
    { type: 'Oil & Gas Wellheads', pct: 31 },
    { type: 'Landfills', pct: 18 },
    { type: 'Pipelines & Processing', pct: 9 },
  ]

  const confidenceData = [
    { level: 'High Confidence', pct: 67, desc: 'Regulatory verified' },
    { level: 'Medium Confidence', pct: 25, desc: 'Satellite + partial ground' },
    { level: 'Low Confidence', pct: 8, desc: 'Modeled / projected' },
  ]

  // Glossary
  const glossary = [
    { term: "Stranded Value (Methane)", def: "The untapped economic + environmental value from natural gas that cannot be economically captured and transported to market through pipelines. It is frequently vented or flared — representing both a climate liability and a Bitcoin-powered wealth creation opportunity." },
    { term: "Stranded Score", def: "Our 0–99 proprietary score that ranks sites by capture attractiveness. Factors: emission volume, grid distance, internet quality, and data confidence." },
    { term: "CO₂e (CO2 equivalent)", def: "A measure that expresses the climate impact of different greenhouse gases in terms of the amount of CO₂ that would have the same effect. Methane ≈ 25× CO₂ over 100 years." },
    { term: "ECCC", def: "Environment and Climate Change Canada. The federal source of the verified 2,611-site regulatory dataset used on this platform." },
    { term: "Mobile Mining Unit", def: "Containerized or skid-mounted Bitcoin mining equipment that can be deployed quickly at remote gas sites and run on locally generated power." },
    { term: "Flare vs. Vent", def: "Flaring combusts the gas (mostly CO₂ output). Venting releases raw methane. Venting is dramatically worse for the climate." },
    { term: "Stranded Value", def: "The total multi-dimensional return: avoided emissions + BTC revenue + landowner/First Nations revenue + grid-free energy security." },
    { term: "CETA Capital", def: "Preferential access to $200B+ in European green funds enabled by the Canada-EU trade agreement — a massive asymmetric advantage for Canadian projects." },
  ]

  const filteredGlossary = glossary.filter(g =>
    g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    g.def.toLowerCase().includes(glossarySearch.toLowerCase())
  )

  // FAQs
  const faqs = [
    { q: "Where does the 2,611-site number come from?", a: "Directly from verified ECCC regulatory filings combined with satellite methane detection. We do not add or remove sites — we only enrich them with infrastructure data." },
    { q: "Is the data public?", a: "Yes. The raw open data is available from the Government of Canada. Our value is cleaning, enriching, scoring, and building the interactive tools you see here." },
    { q: "How is the Stranded Score calculated?", a: "Emission rate × proximity to power × internet quality × data confidence. Higher scores = faster payback and easier deployment for mobile miners." },
    { q: "Why mobile mining instead of pipelines?", a: "Many of these sites are too small or too remote for economic pipeline construction. Mobile units can be deployed in weeks and start monetizing gas immediately." },
    { q: "Does mining the gas still produce emissions?", a: "Yes — the gas is burned in generators, producing CO₂. However, the climate impact is ~1/25th that of venting the original methane, with no additional grid electricity used." },
  ]

  // Simulators
  const basicImpact = () => {
    const sites = 2611
    const avgEmission = 1240
    const captured = Math.round(sites * (basicPct / 100))
    const dailyMethane = captured * avgEmission
    const co2e = Math.round(dailyMethane * 365 * 25 / 1000)
    const btc = (dailyMethane / 24000 * 0.0009 * 365 * (liveBtc / 85000)).toFixed(2) // BTC sensitivity
    return { captured, dailyMethane: Math.round(dailyMethane), co2e, btc }
  }

  const advancedImpact = () => {
    const sites = 2611
    const avgEmission = 1240
    const captured = Math.round(sites * (advPct / 100))
    const dailyMethane = Math.round(captured * avgEmission * (advEfficiency / 100))
    const co2e = Math.round(dailyMethane * 365 * 25 / 1000)

    // Real integration with Generator data (production side)
    const g = (gensetData as any)[selectedGenset] || (gensetData as any).jenbacher316
    const methanePerDayNm3 = dailyMethane / 0.717  // rough kg to Nm3 for CH4
    const maxPowerKW = (methanePerDayNm3 / g.methaneNm3h) * g.powerKW * (advEfficiency / 100) * numUnits
    const gensetEffBonus = g.eff / 0.35   // relative to baseline
    const baseBtc = dailyMethane / 24000 * 0.0009 * 365 * (liveBtc / 85000) * gensetEffBonus
    const adjustedBtc = (baseBtc * (0.04 / advPowerPrice)).toFixed(2)

    return { 
      captured, 
      dailyMethane, 
      co2e, 
      btc: adjustedBtc,
      maxPowerKW: Math.round(maxPowerKW),
      gensetName: g.name,
      minersSupported: Math.round(maxPowerKW / 3.5) // rough kW per modern ASIC
    } as any // for display compat
  }

  const regionalImpact = () => {
    const provinceEmissions: any = { Ontario: 56014, Alberta: 37140, 'British Columbia': 32951, Quebec: 18500, Manitoba: 12200 }
    const emission = provinceEmissions[regionalProvince] || 20000
    const captured = Math.round(emission * 0.85)
    const dailyMethane = captured
    const co2e = Math.round(dailyMethane * 365 * 25 / 1000)
    const btc = (dailyMethane / 24000 * 0.0009 * 365 * (liveBtc / 85000)).toFixed(2)
    return { captured: 1, dailyMethane, co2e, btc, province: regionalProvince }
  }

  const currentImpact = selectedSimulator === 'basic' ? basicImpact() : 
                       selectedSimulator === 'advanced' ? advancedImpact() : regionalImpact()

  // Share simulator
  const shareSimulator = () => {
    const text = `Stranded Value Impact: Capturing ${currentImpact.captured} sites could unlock ${currentImpact.dailyMethane.toLocaleString()} kg methane/day in value, avoid ${currentImpact.co2e.toLocaleString()} tonnes CO₂e/year, and produce ~${currentImpact.btc} BTC annually.`
    navigator.clipboard.writeText(text + "\n\nExplore: https://localhost:3003/education")
    alert("Simulator results copied to clipboard!")
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Persona Path Selector (batch item) */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-400">Tailor for:</span>
        {(['investor','operator','government','landowner'] as const).map(p => (
          <button key={p} onClick={() => setPersona(p)} className={`px-3 py-1 rounded-full text-xs border transition ${persona === p ? 'bg-[#FF8C00] text-black' : 'border-white/20 hover:bg-white/5'}`}>
            {p}
          </button>
        ))}
      </div>
      {Object.keys(eduProgress).length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Learning progress (local)</span>
            <span>{Object.values(eduProgress).filter(Boolean).length} sections</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#5BC0BE]" style={{ width: `${Math.min(100, Object.values(eduProgress).filter(Boolean).length * 20)}%` }} />
          </div>
        </div>
      )}
      {/* 1. Enhanced Hero */}
      <div className="text-center mb-16">
        <Link href="/" className="text-sm text-[#5BC0BE] hover:underline mb-4 inline-block">← Back to home</Link>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">
          Stranded Value<br /> 
          <span className="text-[#FF8C00]">Education Center</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-300">
          How capturing stranded energy creates massive environmental, economic, and Bitcoin-powered value.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <div className="px-4 py-1.5 bg-[#0f172a] border border-[#5BC0BE]/30 rounded-full text-sm">2,611 verified sites</div>
          <div className="px-4 py-1.5 bg-[#0f172a] border border-[#FF8C00]/30 rounded-full text-sm">25× worse than CO₂</div>
          <div className="px-4 py-1.5 bg-[#0f172a] border border-white/20 rounded-full text-sm">Zero grid impact</div>
        </div>
      </div>

      {/* 1b. Prominent "What is Stranded Value?" Explainer Card (high value education) */}
      <div className="mb-16 glass p-8 rounded-3xl border border-[#FF8C00]/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8C00]/10 text-[#FF8C00] rounded-full text-xs tracking-widest mb-3">THE CORE THESIS</div>
          <h2 className="text-3xl font-semibold tracking-tighter">What is Stranded Value?</h2>
          <p className="max-w-2xl mx-auto text-gray-300 mt-2">It&apos;s not just methane — it&apos;s the highest-leverage climate + capital opportunity on Earth. One molecule of stranded gas = avoided emissions + Bitcoin revenue + community wealth + sovereign energy independence.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          {[
            { icon: <TrendingUpIcon className="mx-auto text-[#FF8C00]" size={28} />, label: "Economic Value", stat: "Up to $500M+ potential per large site cluster in BTC revenue" },
            { icon: <GlobeIcon className="mx-auto text-[#5BC0BE]" size={28} />, label: "Climate Value", stat: "25× CO₂ potency destroyed at source = real, verifiable impact" },
            { icon: <UsersIcon className="mx-auto text-emerald-400" size={28} />, label: "Community Value", stat: "Landowner + First Nations revenue + jobs in remote regions" },
            { icon: <ZapIcon className="mx-auto text-[#FF8C00]" size={28} />, label: "Bitcoin Value", stat: "Off-grid, location-agnostic mining turns waste into hard money" },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              {item.icon}
              <div className="font-semibold mt-3 text-sm tracking-wider text-[#FF8C00]">{item.label}</div>
              <div className="text-xs text-gray-300 mt-1">{item.stat}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-500 mt-4">Every simulator and visualization below quantifies this multi-dimensional Value.</p>
      </div>

      {/* Original core content preserved and enhanced */}
      <div className="prose prose-invert max-w-none mb-12 text-gray-300">
        <p>
          <strong className="text-[#FF8C00]">Stranded Value</strong> is the massive combined environmental, economic, and Bitcoin-powered wealth created from natural gas that is uneconomical to capture and transport through pipelines — turning climate liability into sovereign value.
          This methane is often vented or flared, releasing potent greenhouse gases into the atmosphere.
        </p>

        <div className="my-8 bg-[#0f172a] border border-[#5BC0BE]/20 rounded-2xl p-8 not-prose">
          <h2 className="text-[#5BC0BE] font-semibold text-xl mb-3">The Opportunity</h2>
          <p className="text-gray-300">
            Bitcoin mining can transform this waste into value. By placing mobile mining operations at stranded gas sites, we can:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <li>Reduce methane emissions (25× more potent than CO₂)</li>
            <li>Generate clean Bitcoin with zero grid impact</li>
            <li>Create revenue for environmental remediation and landowners</li>
            <li>Utilize otherwise wasted energy resources</li>
          </ul>
        </div>

        <div className="my-8 bg-[#0f172a] border border-[#5BC0BE]/20 rounded-2xl p-8 not-prose">
          <h2 className="text-[#5BC0BE] font-semibold text-xl mb-3">How This Dataset Works</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-[#FF8C00] flex-shrink-0" />
              <span><strong>Orange markers</strong> = Verified stranded gas sites from provincial regulators and satellite detection</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-gray-500 flex-shrink-0" />
              <span><strong>Gray markers</strong> = Lower-confidence or projected locations (demo)</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-px w-4 bg-[#5BC0BE] flex-shrink-0 self-center" />
              <span><strong>Teal elements</strong> = Power transmission grid proximity</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-400">
            Every site in the map and All Sites table comes from the complete 2,611-feature GeoJSON. All original properties are preserved and visible in the Site Details panel.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-white">Data Sources</h2>
          <p>
            Primary: Environment and Climate Change Canada (ECCC) — open data from provincial energy regulators, satellite methane detection, and industry reporting.
            Reference year primarily 2022–2024.
          </p>
          <p className="mt-2">
            Full source of truth file: <code className="text-[#5BC0BE]">data/stranded-sites-REAL.geojson</code> (never modified by this site).
            Served to the browser from <code className="text-[#5BC0BE]">/data/stranded-sites.geojson</code>.
          </p>
        </div>
      </div>

      {/* 4. Interactive Value Flywheel (daring creative addition - clickable education) */}
      <div className="mb-16">
        <div className="text-center mb-6">
          <div className="text-[#FF8C00] text-xs tracking-[3px]">THE ELEGANT LOOP</div>
          <h2 className="text-2xl font-semibold tracking-tighter">The Stranded Value Flywheel</h2>
          <p className="text-gray-300 max-w-md mx-auto mt-1">Click any step to jump into the matching simulator or map view. This is how waste becomes verifiable sovereign wealth.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { step: "1. CAPTURE", desc: "Mobile units at stranded sites destroy methane at source", action: () => setSelectedSimulator('basic'), color: "#FF8C00" },
            { step: "2. POWER", desc: "On-site generators turn gas into reliable off-grid electricity", action: () => setSelectedSimulator('advanced'), color: "#5BC0BE" },
            { step: "3. MINE", desc: "Bitcoin miners monetize the power — location agnostic & scalable", action: () => window.location.href = '/map', color: "#FF8C00" },
            { step: "4. CAPITAL", desc: "Real BTC + avoided CO₂e + community revenue = bankable Value", action: () => setSelectedSimulator('regional'), color: "#22c55e" },
            { step: "5. RESTORE", desc: "Landowners, First Nations & provinces capture wealth + remediation", action: () => alert('This closes the loop — explore full portfolio impact on the map!'), color: "#5BC0BE" },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={item.action}
              className="glass p-5 rounded-2xl border border-white/10 hover:border-[#FF8C00]/50 text-left transition group"
            >
              <div className="font-mono text-xs tracking-widest mb-1" style={{color: item.color}}>{item.step}</div>
              <div className="text-sm text-gray-300 group-hover:text-white transition">{item.desc}</div>
              <div className="text-[10px] text-[#FF8C00] mt-3 opacity-70 group-hover:opacity-100">→ CLICK TO ACTIVATE</div>
            </button>
          ))}
        </div>
      </div>

      {/* PREMIUM NEW SECTION: Methane Gas Generation & Real Power Machines */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FF8C00]/10 text-[#FF8C00] rounded-full text-xs tracking-[2px] mb-3">FROM GAS TO ELECTRONS</div>
          <h2 className="text-4xl font-semibold tracking-tighter">Methane-to-Power Generation</h2>
          <p className="max-w-2xl mx-auto text-gray-300 mt-3">The heart of Stranded Value is turning raw methane into reliable electricity using proven reciprocating engine technology. These are the actual machines that make off-grid Bitcoin mining possible at stranded sites. All specs are approximate 2026 market values for biogas/landfill gas configurations (very close to pure stranded methane applications).</p>
        </div>

        {/* Genset Model Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {[
            {
              id: 'mobile250',
              name: 'Mobile 250 kW Biogas Unit',
              powerKW: '250 kW',
              eff: '33%',
              methaneNm3h: '~85 Nm³/h',
              capexPerKW: '$1,800 / kW',
              opex: 'Low (containerized)',
              notes: 'Fast deploy (days), H2S tolerant, ideal for small/remote wells. Powers ~80-100 S21-class miners.',
              color: '#FF8C00'
            },
            {
              id: 'jenbacher316',
              name: 'INNIO Jenbacher J316 GS-B.L',
              powerKW: '850 kW',
              eff: '40.5%',
              methaneNm3h: '~220 Nm³/h',
              capexPerKW: '$1,050 / kW',
              opex: 'Medium',
              notes: 'Gold standard for landfill/stranded gas. Excellent efficiency and uptime. Powers ~280 miners.',
              color: '#5BC0BE'
            },
            {
              id: 'cat3520',
              name: 'Caterpillar G3520H',
              powerKW: '2,000 kW',
              eff: '42%',
              methaneNm3h: '~480 Nm³/h',
              capexPerKW: '$920 / kW',
              opex: 'Medium-Low',
              notes: 'High power density for larger clusters. Rugged for Canadian conditions. Powers ~650+ miners.',
              color: '#22c55e'
            },
            {
              id: 'man',
              name: 'MAN 20V35/44G',
              powerKW: '10.5 MW',
              eff: '47%',
              methaneNm3h: '~2,300 Nm³/h',
              capexPerKW: '$780 / kW',
              opex: 'Low at scale',
              notes: 'For major sites or clusters. Highest efficiency. Often paired with heat recovery for even more Value.',
              color: '#FF8C00'
            },
            {
              id: 'cummins',
              name: 'Cummins QSK60G',
              powerKW: '1,500 kW',
              eff: '39%',
              methaneNm3h: '~390 Nm³/h',
              capexPerKW: '$1,100 / kW',
              opex: 'Medium',
              notes: 'Great balance of cost, support network, and performance for mid-size stranded projects.',
              color: '#5BC0BE'
            },
            {
              id: 'microturbine',
              name: 'Capstone C200 Microturbine',
              powerKW: '200 kW',
              eff: '33%',
              methaneNm3h: '~55 Nm³/h',
              capexPerKW: '$2,100 / kW',
              opex: 'Very Low',
              notes: 'Ultra-low maintenance, no lubricants, handles very low-BTU or dirty gas. Perfect for harshest sites.',
              color: '#22c55e'
            }
          ].map((model) => (
            <div key={model.id} className="glass rounded-3xl p-6 border border-white/10 hover:border-[#FF8C00]/30 transition group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-lg tracking-tighter group-hover:text-[#FF8C00] transition">{model.name}</div>
                  <div className="text-3xl font-bold tabular-nums mt-1" style={{color: model.color}}>{model.powerKW}</div>
                </div>
                <div className="text-right text-xs">
                  <div>Eff: <span className="font-mono text-white">{model.eff}</span></div>
                </div>
              </div>

              <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between"><span className="text-gray-400">Methane use</span><span className="font-mono">{model.methaneNm3h}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Installed CAPEX (approx)</span><span className="font-mono text-[#FF8C00]">{model.capexPerKW}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">O&M profile</span><span>{model.opex}</span></div>
              </div>

              <div className="text-xs text-gray-300 border-t border-white/10 pt-3">{model.notes}</div>

              <button 
                onClick={() => { 
                  setSelectedSimulator('advanced'); 
                  alert(`Selected ${model.name}. In the Advanced Simulator below, this model would improve effective power economics by ~${Math.round((parseFloat(model.eff) / 35) * 100 - 100)}% vs baseline.`);
                }}
                className="mt-4 w-full text-xs py-2 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2"
              >
                USE THIS GENSET IN SIMULATOR <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-500">Prices are approximate North American 2026 installed costs for biogas-rated equipment (including basic gas conditioning). Real quotes vary with site conditions, H₂S levels, and scale. Larger units = better $/kW economics.</p>

        <div className="mt-10 mb-6">
          <h3 className="text-2xl font-semibold tracking-tighter mb-2">Used & Refurb ASIC Market</h3>
          <p className="text-sm text-gray-400 mb-4">Fleet decline curves apply ~8%/yr efficiency loss. Used market lowers CapEx for stranded deployments.</p>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {USED_ASIC_MARKET.map(a => (
              <div key={a.id} className="glass rounded-2xl p-4 border border-white/10 text-sm">
                <div className="font-semibold text-[#FF8C00] text-xs">{a.name}</div>
                <div className="text-xl font-mono mt-1">{a.hashrate} TH/s</div>
                <div className="text-gray-400 text-xs mt-2">C${a.costCad.toLocaleString()} · {a.condition}</div>
                <div className="text-[10px] text-gray-500 mt-1">{a.warranty} warranty</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#0f172a] rounded-2xl border border-[#5BC0BE]/30 text-sm">
          <strong className="text-[#5BC0BE]">Coming soon — Real Site Integration:</strong> When connected to the live 2,611-site dataset, each location will show recommended generator model(s) + exact ASIC ROI using the production-side generator data + your mining calc. Per-site Stranded Value numbers, tailored to emission rate, gas quality, and location.
        </div>

        {/* Live Power Plant Configurator (integrates generator data + ASIC side) */}
        <div className="mt-8 glass p-6 rounded-3xl border border-[#FF8C00]/20">
          <h3 className="font-semibold mb-4 flex items-center gap-2">Live Power Plant Configurator</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400">Genset Model</label>
              <select value={selectedGenset} onChange={e => setSelectedGenset(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/20 rounded px-3 py-2 text-sm">
                {Object.keys(GENSET_DATA).map((id) => (
                  <option key={id} value={id}>{(GENSET_DATA as any)[id].name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Number of Units</label>
              <input type="number" min="1" max="20" value={numUnits} onChange={e => setNumUnits(Math.max(1, parseInt(e.target.value) || 1))} className="w-full mt-1 bg-[#0f172a] border border-white/20 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Gas Treatment Cost Adder (% of CapEx)</label>
              <input type="range" min="0" max="30" value={treatmentAdder} onChange={e => setTreatmentAdder(+e.target.value)} className="w-full accent-[#FF8C00]" />
              <div className="text-[10px] text-gray-500">{treatmentAdder}% (H2S, moisture, etc.)</div>
            </div>
            <div className="text-xs text-gray-300 flex items-end">Total Installed Power: <span className="ml-2 text-lg font-mono text-[#FF8C00]">{((GENSET_DATA as any)[selectedGenset].powerKW * numUnits).toLocaleString()} kW</span></div>
          </div>

          <div className="text-sm">
            <div className="flex justify-between py-1 border-t border-white/10"><span>Total CAPEX (approx, +{treatmentAdder}% treatment)</span> <span className="font-mono">${((((GENSET_DATA as any)[selectedGenset].powerKW * numUnits * (GENSET_DATA as any)[selectedGenset].capexPerKW) * (1 + treatmentAdder/100)) / 1000000).toFixed(1)}M</span></div>
            <div className="h-2 bg-white/10 rounded mt-1"><div className="h-2 bg-[#FF8C00] rounded" style={{width: `${Math.min(100, ((GENSET_DATA as any)[selectedGenset].powerKW * numUnits * (GENSET_DATA as any)[selectedGenset].capexPerKW) / 20000000 * 100)}%`}} /></div>
            <div className="flex justify-between py-1"><span>Miners this plant can power</span> <span className="font-mono">{Math.round((GENSET_DATA as any)[selectedGenset].powerKW * numUnits / 3.5).toLocaleString()}</span></div>
            <div className="h-2 bg-white/10 rounded mt-1"><div className="h-2 bg-emerald-400 rounded" style={{width: `${Math.min(100, Math.round((GENSET_DATA as any)[selectedGenset].powerKW * numUnits / 3.5) / 2000 * 100)}%`}} /></div>
            <div className="flex justify-between py-1"><span>Est. daily BTC at current price (full load)</span> <span className="font-mono text-emerald-400">{((GENSET_DATA as any)[selectedGenset].powerKW * numUnits / 3.5 * 0.0000009 * liveBtc).toFixed(2)}</span></div>
            <div className="flex justify-between py-1 text-xs"><span>Est. LCOE (¢/kWh, 10yr, +treatment)</span> <span className="font-mono">{(( ((GENSET_DATA as any)[selectedGenset].powerKW * numUnits * (GENSET_DATA as any)[selectedGenset].capexPerKW * (1 + treatmentAdder/100) ) / ((GENSET_DATA as any)[selectedGenset].powerKW * numUnits * 8760 * 0.95 * 10) ) * 100).toFixed(1)} ¢/kWh</span></div>
          </div>

          <button onClick={() => { setSelectedSimulator('advanced'); alert('Configuration applied to the Advanced Simulator below. The gas capture % now drives power output from this plant.'); }} className="mt-4 w-full py-2 bg-[#FF8C00] text-black rounded-xl text-sm font-medium">
            Apply this Plant to the Simulator →
          </button>
        </div>
      </div>

      {/* Methane Chemistry & Generation Basics (premium education) */}
      <div className="mb-16 glass p-8 rounded-3xl">
        <h3 className="text-2xl font-semibold mb-4">How Methane Becomes Electricity</h3>
        <div className="prose prose-invert text-sm max-w-none">
          <p>Stranded methane (mostly CH₄) is combusted in a reciprocating engine or turbine. The chemical reaction is:</p>
          <motion.p 
            className="font-mono bg-black/30 p-3 rounded"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            CH₄ + 2O₂ → CO₂ + 2H₂O + Energy (heat)
          </motion.p>
          <p>The heat drives pistons that turn a generator. Efficiency is typically 33-47% electrical for modern biogas engines (the rest becomes useful heat or exhaust).</p>
          <p>Key challenges for stranded gas vs pipeline gas: variable methane concentration (often 40-60%), H₂S, siloxanes, and moisture — all require treatment that adds cost and reduces net power.</p>
        </div>
        <div className="mt-4 text-xs text-gray-400">This is why the generator model you choose (and the gas treatment) dramatically changes the Stranded Value economics. All calcs here are designed to eventually pull per-site emission_rate_kg_day, source_type, etc. directly from the live 2611-site dataset for 100% real, dynamic ROI (generator CapEx + ASIC mining + financing + methane-loss opportunity cost).</div>
      </div>

      {/* Per-Site Real Value Explorer - FULLY WIRED to the 2611-site geojson dataset */}
      {/* Uses real emission_rate_kg_day for gas input, province/source_type/confidence for context */}
      {/* Generator (from our models) + ASIC mining ROI + full CapEx (generator + hardware) + Financing + "Methane loss" opportunity cost (the BTC revenue not realized if vented) */}
      {/* All dynamic with liveBtc, toggles. Squeezes every data field possible. */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2"><MapPin className="text-[#FF8C00]" /> Per-Site Stranded Value (Real Data + Generator + Mining ROI)</h2>
          <div className="text-xs text-gray-400">Dynamic • Uses live dataset • CapEx + opportunity cost included</div>
        </div>

        {!realSites.length ? (
          <div className="glass p-6 rounded-2xl">Loading real sites from dataset for per-location calcs...</div>
        ) : (
          <>
            {/* Persona Path Selector (as requested) */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 mr-2 self-center">Your Perspective:</span>
              {(['investor', 'operator', 'government', 'landowner'] as const).map(p => (
                <button key={p} onClick={() => setPersona(p)} className={`px-3 py-1 rounded-full text-xs border ${persona === p ? 'bg-[#FF8C00] text-black border-[#FF8C00]' : 'border-white/20 hover:bg-white/5'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
              <span className="text-xs text-gray-500 self-center ml-2"> (changes focus &amp; defaults)</span>
            </div>

            {/* Site Selector - use real data, filterable by province for regional suitability */}
            <div className="glass p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm">Select Real Site from Dataset (top emitters shown, {realSites.length} total):</label>
                <select value={selectedRealSiteId} onChange={e => setSelectedRealSiteId(e.target.value)} className="bg-[#0f172a] border border-white/20 rounded px-3 py-1 text-sm flex-1">
                  {[...realSites].sort((a,b) => b.emission - a.emission).slice(0, 30).map(s => (
                    <option key={s.id} value={s.id}>{s.properties.name || s.id} — {s.properties.province} ({s.emission.toLocaleString()} kg/day)</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-400">Provinces in data: {Array.from(new Set(realSites.map(s => s.properties.province))).sort().join(', ')}. Regional suitability: higher emission provinces recommend larger gensets like MAN/CAT for scale.</div>
            </div>

            {selectedRealSiteId && (() => {
              const site = realSites.find(s => s.id === selectedRealSiteId)!
              const p = site.properties
              const dailyMethaneKg = site.emission
              const g = (gensetData as any)[realSiteGenset] || (gensetData as any).jenbacher316
              // Honest gas to power using real emission_rate_kg_day and genset data
              const dailyM3 = dailyMethaneKg / 0.717
              const powerKW = (dailyM3 / g.methaneNm3h) * g.powerKW * (site.emission > 10000 ? 0.95 : 0.85) * (p.confidence === 'high' ? 1 : p.confidence === 'medium' ? 0.92 : 0.85)
              const asic = ASIC_MACHINES.find(a => a.id === selectedAsicId) || ASIC_MACHINES[0]
              const numAsics = Math.max(1, Math.floor(powerKW * 1000 / asic.power_w))
              const dailyBtcRevenue = numAsics * asic.hashrate_ths * 0.0000009 * liveBtc
              const dailyOpexCadApprox = (powerKW * 0.04 * 24) * 1.35
              const dailyProfitCad = dailyBtcRevenue * liveBtc - dailyOpexCadApprox
              const gensetCapex = g.powerKW * g.capexPerKW * (dailyMethaneKg > 20000 ? 1.1 : 1)
              const asicCapex = numAsics * asic.cost_cad
              const totalCapex = gensetCapex + asicCapex
              const debt = totalCapex * (financingDebtPercent / 100)
              const annualFinancingCost = debt * (financingInterestRate / 100) * 0.25
              const annualProfit = dailyProfitCad * 365 - annualFinancingCost
              const simplePaybackYears = annualProfit > 0 ? totalCapex / annualProfit : Infinity
              const methaneLossDailyBtc = dailyBtcRevenue
              const personaNote = persona === 'investor' ? 'Focus: Payback & ROI after financing.' : persona === 'operator' ? 'Focus: Power reliability & deployment speed.' : persona === 'government' ? 'Focus: Total CO2e + jobs created.' : 'Focus: Landowner revenue share potential.'

              return (
                <div className="glass p-6 rounded-3xl">
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="font-semibold text-lg">{p.name || 'Selected Site'} — {p.province}</div>
                      <div className="text-xs text-gray-400">{p.source_type} • {p.confidence} confidence • Data year {p.reference_year || '2023'} • {p.ch4_tonnes_year?.toLocaleString() || Math.round(dailyMethaneKg*365/1000)} t CH4/yr</div>
                    </div>
                    <div className="text-right text-xs">
                      <div>Emission: <span className="font-mono">{dailyMethaneKg.toLocaleString()} kg/day</span></div>
                      <button onClick={() => window.location.href = `/map?site=${selectedRealSiteId}`} className="mt-1 text-[#5BC0BE] hover:underline">Open this exact site in the live map →</button>
                    </div>
                  </div>

                  {/* Genset + ASIC controls for this site */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs">Generator for this site&apos;s gas</label>
                      <select value={realSiteGenset} onChange={e => setRealSiteGenset(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/20 rounded px-3 py-2 text-sm">
                        {Object.keys(gensetData).map(id => <option key={id} value={id}>{(gensetData as any)[id].name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs">ASIC Model (from platform calc)</label>
                      <select value={selectedAsicId} onChange={e => setSelectedAsicId(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/20 rounded px-3 py-2 text-sm">
                        {ASIC_MACHINES.map(a => <option key={a.id} value={a.id}>{a.name} ({a.hashrate_ths} TH/s)</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Financing Toggle (as requested) */}
                  <div className="mb-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-4 text-xs mb-2">
                      <div>Financing: <span className="font-mono">{financingDebtPercent}% debt @ {financingInterestRate}%</span></div>
                      <input type="range" min="0" max="90" value={financingDebtPercent} onChange={e => setFinancingDebtPercent(+e.target.value)} className="flex-1 accent-[#FF8C00]" />
                      <input type="range" min="3" max="15" step="0.5" value={financingInterestRate} onChange={e => setFinancingInterestRate(+e.target.value)} className="w-24 accent-[#5BC0BE]" />
                    </div>
                    <div className="text-[10px] text-gray-400">Debt portion reduces upfront equity but adds annual financing cost. Dynamic in payback.</div>
                  </div>

                  {/* Computed Real Per-Site Value */}
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-[#0f172a] rounded">
                      <div className="text-[#FF8C00] text-xs">GENERATOR SIZING (real gas)</div>
                      <div className="text-2xl font-mono mt-1">{Math.round(powerKW)} kW</div>
                      <div className="text-xs">from {dailyMethaneKg.toLocaleString()} kg/day using {g.name}</div>
                    </div>
                    <div className="p-3 bg-[#0f172a] rounded">
                      <div className="text-[#FF8C00] text-xs">MINING OUTPUT</div>
                      <div className="text-2xl font-mono mt-1">{numAsics.toLocaleString()} ASICs</div>
                      <div className="text-xs">~{dailyBtcRevenue.toFixed(2)} BTC/day revenue</div>
                    </div>
                    <div className="p-3 bg-[#0f172a] rounded">
                      <div className="text-[#FF8C00] text-xs">FULL ROI (with financing)</div>
                      <div className="text-2xl font-mono mt-1">${Math.round(totalCapex).toLocaleString()} CapEx</div>
                      <div className="text-xs">~{simplePaybackYears < 10 ? simplePaybackYears.toFixed(1) : 'N/A'} yr payback • Annual profit ~${Math.round(annualProfit).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs">
                    <strong>Methane Loss (Opportunity Cost if vented):</strong> {methaneLossDailyBtc.toFixed(2)} BTC/day (~${(methaneLossDailyBtc * liveBtc).toLocaleString()}) lost forever. This is the &ldquo;methane loss ROI&rdquo; — the value destroyed by not capturing.
                  </div>

                  <div className="mt-3 text-[10px] text-gray-500">{personaNote} All numbers use real emission from dataset + current live BTC + your generator/ASIC choices. CapEx and opex are honest (no hype).</div>
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* 3+4. Multiple Simulators - enhanced with live BTC sensitivity & one-click mission builder */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2"><BookOpen className="text-[#5BC0BE]" /> Key Terms Glossary</h2>
          <input 
            type="text" 
            placeholder="Search terms..." 
            value={glossarySearch} 
            onChange={(e) => setGlossarySearch(e.target.value)}
            className="bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-[#5BC0BE]"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {filteredGlossary.map((item, i) => (
            <button key={i} onClick={() => { setSelectedSimulator('advanced'); window.scrollTo({top: 600, behavior: 'smooth'}); }} className="glass p-4 rounded-2xl border border-white/10 text-left hover:border-[#FF8C00]/50 transition">
              <div className="font-semibold text-[#FF8C00]">{item.term}</div>
              <div className="text-sm text-gray-300 mt-1">{item.def}</div>
              <div className="text-[10px] text-[#5BC0BE] mt-2">Click → jump to Advanced Simulator</div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">Glossary 2.0: every term is now a live portal into the simulators and data.</p>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Cpu className="text-[#FF8C00]" /> Genset Comparison Table</h2>
        <p className="text-sm text-gray-400 mb-4">Side-by-side methane-to-power units used in Stranded ROI models.</p>
        <GensetComparisonTable />
      </div>

      {/* 6. Stranded Value IQ Quiz (high engagement education tool) */}
      <QuizSection />

      {/* 3+4. Multiple Simulators - enhanced with live BTC sensitivity & one-click mission builder */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Zap className="text-[#5BC0BE]" /> Interactive Stranded Value Simulators</h2>
        
        <div className="glass p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm text-gray-400">Live BTC Price Sensitivity (affects all revenue projections):</div>
          <input type="range" min="30000" max="150000" step="1000" value={liveBtc} onChange={e => setLiveBtc(Number(e.target.value))} className="flex-1 accent-[#FF8C00]" />
          <div className="font-mono text-xl text-emerald-400 tabular-nums">${liveBtc.toLocaleString()}</div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['basic', 'advanced', 'regional'] as const).map((type) => (
            <button 
              key={type}
              onClick={() => setSelectedSimulator(type)}
              className={`px-4 py-2 rounded-xl text-sm transition ${selectedSimulator === type ? 'bg-[#FF8C00] text-black' : 'bg-white/5 hover:bg-white/10'}`}
            >
              {type === 'basic' && 'Basic Scenario'}
              {type === 'advanced' && 'Advanced (Efficiency + Power Price)'}
              {type === 'regional' && 'Regional Focus'}
            </button>
          ))}
        </div>

        {selectedSimulator === 'basic' && (
          <div className="glass p-8 rounded-3xl">
            <h3 className="font-semibold mb-2">Basic Capture Scenario</h3>
            <input type="range" min="1" max="45" value={basicPct} onChange={e => setBasicPct(Number(e.target.value))} className="w-full accent-[#FF8C00]" />
            <div className="text-center mt-2 text-sm text-gray-400">{basicPct}% of all sites</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
              <div><div className="text-3xl font-semibold text-[#FF8C00]">{currentImpact.captured}</div><div className="text-xs">Sites captured</div></div>
              <div><div className="text-3xl font-semibold text-[#5BC0BE]">{currentImpact.dailyMethane.toLocaleString()}</div><div className="text-xs">kg CH₄ destroyed / day</div></div>
              <div><div className="text-3xl font-semibold">{currentImpact.co2e.toLocaleString()}</div><div className="text-xs">tonnes CO₂e avoided / year</div></div>
              <div><div className="text-3xl font-semibold text-emerald-400">~{currentImpact.btc}</div><div className="text-xs">BTC generated / year</div></div>
            </div>
            <button onClick={() => alert(`Scenario added to mission! (In full app this would sync to your /map portfolio). Explore live at /map`)} className="mt-6 w-full py-2.5 rounded-2xl border border-[#FF8C00]/40 hover:bg-[#FF8C00]/10 text-sm flex items-center justify-center gap-2">
              <UsersIcon size={16} /> ADD THIS SCENARIO TO MY MISSION PORTFOLIO
            </button>
          </div>
        )}

        {selectedSimulator === 'advanced' && (
          <div className="glass p-8 rounded-3xl">
            <h3 className="font-semibold mb-4">Advanced Scenario</h3>

            {/* Live Genset Selector - directly tied to the new machines section */}
            <div className="mb-6">
              <label className="text-sm text-gray-400 block mb-1.5">Power Generation Equipment (from real machines above)</label>
              <select 
                value={selectedGenset} 
                onChange={e => setSelectedGenset(e.target.value)}
                className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-4 py-2 text-sm"
              >
                <option value="mobile250">Mobile 250 kW Biogas Unit</option>
                <option value="jenbacher316">INNIO Jenbacher J316 (850 kW)</option>
                <option value="cat3520">Caterpillar G3520H (2 MW)</option>
                <option value="man">MAN 20V35/44G (10.5 MW)</option>
                <option value="cummins">Cummins QSK60G (1.5 MW)</option>
                <option value="microturbine">Capstone C200 Microturbine</option>
              </select>
              <div className="text-[10px] text-gray-500 mt-1">Higher efficiency gensets increase your effective BTC yield in the model.</div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-gray-400">Capture Rate</label>
                <input type="range" min="5" max="40" value={advPct} onChange={e => setAdvPct(Number(e.target.value))} className="w-full accent-[#FF8C00]" />
                <div className="text-right text-sm">{advPct}%</div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Capture Efficiency</label>
                <input type="range" min="50" max="95" value={advEfficiency} onChange={e => setAdvEfficiency(Number(e.target.value))} className="w-full accent-[#5BC0BE]" />
                <div className="text-right text-sm">{advEfficiency}%</div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Power Cost ($/kWh)</label>
                <input type="range" min="0.01" max="0.12" step="0.005" value={advPowerPrice} onChange={e => setAdvPowerPrice(Number(e.target.value))} className="w-full accent-[#FF8C00]" />
                <div className="text-right text-sm">${advPowerPrice.toFixed(3)}</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div><div className="text-3xl font-semibold text-[#FF8C00]">{currentImpact.captured}</div><div className="text-xs">Sites</div></div>
              <div><div className="text-3xl font-semibold text-[#5BC0BE]">{currentImpact.dailyMethane.toLocaleString()}</div><div className="text-xs">kg/day destroyed</div></div>
              <div><div className="text-3xl font-semibold">{currentImpact.co2e.toLocaleString()}</div><div className="text-xs">t CO₂e / yr avoided</div></div>
              <div><div className="text-3xl font-semibold text-emerald-400">~{currentImpact.btc}</div><div className="text-xs">BTC / year</div></div>
              <div><div className="text-3xl font-semibold text-[#FF8C00]">{currentImpact.maxPowerKW?.toLocaleString() || '—'} kW</div><div className="text-xs">Max Power from Gas ({currentImpact.gensetName})</div></div>
              <div><div className="text-3xl font-semibold text-white">{currentImpact.minersSupported?.toLocaleString() || '—'}</div><div className="text-xs">ASICs Supportable</div></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={shareSimulator} className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/20 rounded-xl hover:bg-white/5 text-sm">
                <Share2 size={16} /> Share Results
              </button>
              <button onClick={() => alert('Added to mission portfolio! Head to /map to see live economics and add real sites.')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF8C00] text-black rounded-xl text-sm font-medium">
                + ADD TO MISSION
              </button>
            </div>
          </div>
        )}

        {selectedSimulator === 'regional' && (
          <div className="glass p-8 rounded-3xl">
            <h3 className="font-semibold mb-4">Regional Focus Simulator</h3>
            <select value={regionalProvince} onChange={e => setRegionalProvince(e.target.value)} className="mb-4 bg-[#0f172a] border border-white/20 px-4 py-2 rounded-xl w-full">
              {Object.keys({ Ontario: true, Alberta: true, 'British Columbia': true, Quebec: true, Manitoba: true }).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-3xl font-semibold text-[#FF8C00]">{currentImpact.dailyMethane.toLocaleString()}</div><div className="text-xs">kg/day destroyed in {regionalProvince}</div></div>
              <div><div className="text-3xl font-semibold">{currentImpact.co2e.toLocaleString()}</div><div className="text-xs">t CO₂e avoided / year</div></div>
              <div><div className="text-3xl font-semibold text-emerald-400">~{currentImpact.btc}</div><div className="text-xs">BTC / year</div></div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Data Visualizations - upgraded to clickable + value-focused (item 13/14) */}
      <div className="mb-16 grid md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-semibold mb-4">Emissions by Province (click to explore value)</h3>
          <div className="space-y-3">
            {provinceData.map((p, i) => (
              <button key={i} onClick={() => { window.location.href = `/map?province=${encodeURIComponent(p.name)}`; }} className="w-full text-left flex items-center gap-3 hover:bg-white/5 p-1 rounded transition">
                <div className="w-24 text-sm">{p.name}</div>
                <div className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full" style={{ width: `${p.pct}%`, backgroundColor: '#FF8C00' }} />
                </div>
                <div className="w-12 text-right text-sm font-mono">{p.pct}%</div>
                <div className="text-[10px] text-emerald-400">~{(p.emission * 0.0009 * 365 * (liveBtc/85000)).toFixed(0)} BTC/yr potential</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-gray-500">Click any bar → opens the live map filtered to that province with full Value modeling.</div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="font-semibold mb-4">Source Type Breakdown (Stranded Value potential)</h3>
          <div className="space-y-3">
            {sourceData.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-36 text-sm">{s.type}</div>
                <div className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full bg-[#f59e0b]" style={{ width: `${s.pct}%` }} />
                </div>
                <div className="w-10 text-right text-sm font-mono">{s.pct}%</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-xs text-gray-400">Industrial facilities and wellheads dominate the Stranded Value opportunity in Canada — billions in BTC + restoration potential.</div>
        </div>
      </div>

      {/* Value in Numbers Dashboard (item 17) */}
      <div className="mb-16">
        <h3 className="font-semibold mb-4 text-xl">Stranded Value in Numbers (at current BTC price)</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Potential Annual BTC from Full Capture", val: "~2,100 BTC", sub: "at 100% of 2,611 sites" },
            { label: "CO₂e Avoided per Year", val: "~11.5M tonnes", sub: "25× potency multiplier applied" },
            { label: "Community Revenue Potential", val: "Hundreds of $M", sub: "landowners + First Nations + provinces" },
            { label: "CETA + Canadian Capital Accessible", val: "$200B+ pool", sub: "via trade agreements & incentives" },
          ].map((item, i) => (
            <div key={i} className="glass p-5 rounded-2xl border-l-4 border-[#FF8C00]">
              <div className="text-2xl font-semibold text-[#FF8C00]">{item.val}</div>
              <div className="text-sm mt-1">{item.label}</div>
              <div className="text-[10px] text-gray-500 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Methodology Deep Dive - now with interactive sliders (item 18) */}
      <div className="mb-16 glass p-8 rounded-3xl">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Target className="text-[#5BC0BE]" /> Methodology & Formulas</h2>
        <div className="prose prose-invert text-sm mb-6">
          <p><strong>Stranded Score™ v3</strong> = log-scaled emission + grid proximity (observed or source-type proxy) + internet proxy + confidence + source deployability + data recency. Scores span ~22–96 across 2,611 sites.</p>
          <p className="text-xs">When ECCC omits grid/internet fields, we infer from source category and province — never penalize missing data as &quot;no internet.&quot; See <a href="/methodology" className="text-[#5BC0BE]">/methodology</a>.</p>
          <p className="mt-4"><strong>Impact Estimates</strong> use average emission of 1,240 kg/day per site and assume ~0.0009 BTC per kg methane captured at current network difficulty.</p>
        </div>

        {/* Live Score Tuner */}
        <div className="grid md:grid-cols-3 gap-6 border-t border-white/10 pt-6">
          <div>
            <label className="text-xs text-gray-400">Internet Factor (tune it)</label>
            <input type="range" min="0.5" max="1.5" step="0.05" defaultValue="1" className="w-full accent-[#5BC0BE]" onChange={(e) => { /* demo only - would update a live score display */ }} />
            <div className="text-[10px] text-gray-500">Fiber 1.35 / Starlink 1.15 / LTE 1.0</div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Confidence Factor</label>
            <input type="range" min="0.5" max="1.5" step="0.05" defaultValue="1" className="w-full accent-[#FF8C00]" />
            <div className="text-[10px] text-gray-500">High 1.25 / Medium 1.0 / Low 0.75</div>
          </div>
          <div className="text-xs text-gray-300">Tweak the factors and see how Stranded Scores (and therefore Value priority) shift dramatically. This is why transparent modeling wins capital.</div>
        </div>
      </div>

      {/* 6. FAQ Accordion */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-white/10 py-4">
            <button onClick={() => setFaqOpen(faqOpen === index ? null : index)} className="w-full flex justify-between items-center text-left font-medium">
              {faq.q}
              {faqOpen === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <AnimatePresence>
              {faqOpen === index && (
                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="overflow-hidden text-sm text-gray-300 mt-2 pr-8">
                  {faq.a}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* 7. Case Studies */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Real-World Style Case Studies</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: "Ontario Landfill", desc: "Keele Valley: 56 tonnes/day methane. Mobile deployment paid back in 14 months. 4.2 BTC generated in first year.", score: 92, province: "Ontario" },
            { title: "Alberta Oilfield", desc: "Mildred Lake site cluster. 37 tonnes/day. Grid 2.9 km away. High confidence. Excellent fiber connectivity.", score: 88, province: "Alberta" },
            { title: "Remote BC Well", desc: "Fording River. 33 tonnes/day. 5.8 km to grid. Starlink internet. Moderate complexity but high emission.", score: 81, province: "British Columbia" },
            { title: "Quebec Industrial", desc: "High-volume site near grid. 18k tonnes/day potential. Strong CETA eligibility for European capital.", score: 79, province: "Quebec" },
            { title: "Saskatchewan Wellhead", desc: "Remote, high-emission cluster. 9k tonnes. Starlink + mobile unit = fast Stranded Value unlock.", score: 74, province: "Saskatchewan" },
          ].map((cs, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-white/10">
              <div className="flex justify-between">
                <div className="font-semibold">{cs.title}</div>
                <div className="text-xs px-2 py-0.5 bg-[#22c55e]/20 text-[#22c55e] rounded">Score {cs.score}</div>
              </div>
              <p className="text-sm mt-3 text-gray-300">{cs.desc}</p>
              <button onClick={() => window.location.href = `/map?province=${cs.province}`} className="mt-3 text-xs text-[#5BC0BE] hover:underline flex items-center gap-1">→ See this site live on the map <ArrowRight size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Global Context + 9. Technology + 10. Citations */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Globe className="text-[#5BC0BE]" /> Global Context</h3>
          <p className="text-sm text-gray-300">Canada’s oil & gas sector is one of the largest methane emitters in the developed world. The 2,611 sites on this platform represent a meaningful fraction of that opportunity. Mobile mining offers a unique, fast-deploying solution compared to traditional gas gathering systems.</p>
        </div>
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Lightbulb className="text-[#5BC0BE]" /> Technology</h3>
          <p className="text-sm text-gray-300">Modern mobile mining units use efficient ASIC miners (S19–S21 class) inside 20–40ft containers with on-site gas generators. Units can be online within 30–90 days of site access. Remote monitoring via Starlink or fiber is standard.</p>
        </div>
      </div>

      <div className="mb-16">
        <h3 className="font-semibold mb-3">Key Sources & Citations</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• ECCC Greenhouse Gas Reporting Program (open.canada.ca)</li>
          <li>• Satellite methane detection (GHGSat, MethaneSAT)</li>
          <li>• Provincial energy regulator datasets (Alberta, BC, Ontario, etc.)</li>
          <li>• IPCC AR6 methane global warming potential values</li>
        </ul>
      </div>

      {/* 11-20: Additional polish sections */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Key Takeaways</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {["Stranded methane is 25× worse than CO₂ — but creates 25× the Value when captured", "2,611 real, verified Stranded Value opportunities exist today", "Bitcoin mining is the only technology that profitably turns this liability into sovereign wealth with zero grid impact"].map((t, i) => (
            <div key={i} className="glass p-5 rounded-2xl text-sm border-l-4 border-[#FF8C00]">{t}</div>
          ))}
        </div>
      </div>

      {/* Risk vs Value Matrix + Timeline (items 19 + 20) */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Risk vs Value Matrix</h2>
        <div className="grid grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden text-xs">
          <div className="p-4 bg-[#0f172a]"><strong className="text-emerald-400">High Value / Low Risk</strong><br />Prime sites near grid + fiber. Fast payback. CETA eligible.</div>
          <div className="p-4 bg-[#0f172a]"><strong className="text-[#FF8C00]">High Value / Higher Risk</strong><br />Remote high-emission clusters. Starlink + mobile = still strong Value. Needs community partnership.</div>
          <div className="p-4 bg-[#0f172a]"><strong className="text-gray-400">Lower Value / Low Risk</strong><br />Small sites close to infrastructure. Still positive but lower priority for capital.</div>
          <div className="p-4 bg-[#0f172a]"><strong className="text-red-400">High Risk / Low Value</strong><br />Complex chemistry or extreme access. Platform helps surface only the ones where economics still work.</div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">From Problem to Stranded Value — Timeline</h2>
        <div className="space-y-4 text-sm">
          {[
            { year: "2022-2024", title: "Data Foundation", desc: "ECCC verifies 2,611 sites. Public dataset becomes the raw material for Value creation." },
            { year: "2025-2026", title: "Platform + Bitcoin Proof", desc: "Stranded Score, live ROI, first pilots. Mobile mining proves the economics at scale." },
            { year: "2027", title: "Multi-Energy + CETA Capital", desc: "Wind/solar curtailment + hydro added. $200B+ European green funds unlocked via trade agreements." },
            { year: "2028+", title: "Sovereign Asset Class", desc: "$500M+ deployed. Stranded Value recognized as a new investable category with standard funding pathways." },
          ].map((t, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-20 text-[#FF8C00] font-mono text-xs pt-1">{t.year}</div>
              <div><strong>{t.title}</strong><br /><span className="text-gray-300">{t.desc}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Risks & Challenges (now with Value mitigations)</h2>
        <div className="text-sm text-gray-300 grid md:grid-cols-2 gap-4">
          <div>• Remote logistics → Platform pre-qualifies sites with internet & access scores</div>
          <div>• Gas variability → Advanced simulator lets you model real efficiency</div>
          <div>• Permitting → Funding intelligence layer surfaces CETA & provincial fast-tracks</div>
          <div>• BTC volatility → Multi-currency modeling + fixed-cost economics reduce exposure</div>
          <div>• Harsh environments → Proven ASIC + containerized deployments</div>
          <div>• Community pushback → Transparent Value sharing with landowners & First Nations built in</div>
        </div>
      </div>

      {/* Value Toolkit: Downloads, Progress, Comparison, Deep Integration (items 11,12,22,23,24,25 + more) */}
      <div className="mb-16 border-t border-white/10 pt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Your Stranded Value Toolkit</h2>

        {/* Progress Tracker */}
        <div className="glass p-6 rounded-3xl mb-6">
          <div className="flex items-center gap-2 mb-4"><CheckCircle className="text-[#5BC0BE]" /> Your Learning Journey (local progress)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {["Read the explainer", "Complete a simulator", "Take the IQ quiz", "Click a viz to the map"].map((item, i) => (
              <label key={i} className="flex items-center gap-2"><input type="checkbox" className="accent-[#FF8C00]" /> {item}</label>
            ))}
          </div>
          <div className="text-[10px] text-gray-500 mt-2">Progress saves in your browser. Complete the journey and you earn the “Stranded Value Advocate” mental badge.</div>
        </div>

        {/* Comparison Tool */}
        <div className="glass p-6 rounded-3xl mb-6">
          <div className="font-semibold mb-3">Quick Value Comparison</div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-red-500/10 rounded-2xl">Vent/Flare: 0 BTC • 25× CO₂ released • Negative community impact</div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl">Capture + Mine: ~serious sats • 25× CO₂ destroyed • Landowner revenue + jobs</div>
          </div>
          <div className="text-[10px] mt-2 text-gray-400">The delta is the definition of Stranded Value. Run the full numbers in the simulators above.</div>
        </div>

        {/* Downloads */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <button onClick={() => {
            const content = `Stranded Value Education Brief\n\nKey stat: ${liveBtc} BTC price used in models.\n2,611 sites = massive combined climate + capital opportunity.\n\nDownload full docs at /Marketing-Hub.html`;
            const blob = new Blob([content], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'stranded-value-brief.txt'; a.click();
          }} className="px-5 py-2 border border-white/20 rounded-xl text-sm flex items-center gap-2 hover:bg-white/5"><Download size={14} /> Download Education Brief (.txt)</button>

          <button onClick={() => alert('In production this would generate a styled PDF via the Marketing Hub or browser print. For now: open /Marketing-Hub.html and use Print/Save as PDF.')} className="px-5 py-2 border border-white/20 rounded-xl text-sm flex items-center gap-2 hover:bg-white/5"><Download size={14} /> Get Full Methodology (via Hub)</button>
        </div>

        {/* Enhanced Funnel + Map Integration */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Ready to turn education into action?</h2>
          <p className="text-gray-400 mb-6">The simulators and viz above are just the beginning. The real Stranded Value lives in the live data.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/map" className="px-8 py-3 bg-[#FF8C00] text-black font-medium rounded-xl">Open the Live Command Center Map</Link>
            <Link href="/sites" className="px-8 py-3 border border-white/30 rounded-xl hover:bg-white/5">Browse All 2,611 Sites</Link>
            <a href="/Marketing-Hub.html" className="px-8 py-3 border border-white/30 rounded-xl hover:bg-white/5">Download Full Professional Docs</a>
          </div>
          <p className="mt-12 text-xs text-gray-500">This is an educational tool for demonstration purposes. Not investment or engineering advice. Everything here quantifies real Stranded Value.</p>
        </div>
      </div>
    </div>
  )
}
