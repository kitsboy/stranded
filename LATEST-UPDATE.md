# stranded — Last Updated 2026-09-12 by Ziggy (Astra repair 1)

**Brief:** One shared methane budget per site; truthful preset previews (Mission: 533/530/225/574/533 kW, never 41k/218k).

**Commit:** `bc6b6d1`

- `dispatchSiteGas` — efficiency-first, unit-capped; adding generators never multiplies fuel
- Preview = Apply (explicit inventory); unsupported miners identified, earn nothing
- No invented landfill venting baseline or avoided-emissions claims
- Fuel conservation unit tests + rendered-DOM e2e (1400/390); CI runs `npm test`
