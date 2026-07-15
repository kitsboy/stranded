/** Canadian province/territory codes for deep links and print pages. */
export const PROVINCE_CODES: { code: string; name: string }[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'QC', name: 'Quebec' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'YT', name: 'Yukon' },
]

export function resolveProvinceName(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const byCode = PROVINCE_CODES.find(p => p.code.toLowerCase() === trimmed.toLowerCase())
  if (byCode) return byCode.name
  const byName = PROVINCE_CODES.find(p => p.name.toLowerCase() === trimmed.toLowerCase())
  if (byName) return byName.name
  // partial match (e.g. "Alberta" from provinces page)
  const partial = PROVINCE_CODES.find(p => p.name.toLowerCase().startsWith(trimmed.toLowerCase()))
  return partial?.name ?? (trimmed.length > 2 ? trimmed : null)
}

export function provinceCode(name: string): string {
  return PROVINCE_CODES.find(p => p.name === name)?.code ?? name.slice(0, 2).toUpperCase()
}