/**
 * ─── MENTORSHIP V2 (PHASE 8) PRICING ADMIN TYPES ──────────────────────────────
 *
 * Mirrors `AdminZonePricingSnapshot` and `FxRateService.FetchReport` one-for-one.
 */

export interface ZoneRow {
  zoneCode: string
  label: string
  defaultMultiplier: string
  displayCurrency: string
  displayOrder: number
  active: boolean
  updatedAt: string | null
  /** How many countries route here. Zero means the zone is defined but reaches nobody. */
  countryCount: number
  /** How many per-service overrides point at it — what retiring it would orphan. */
  overrideCount: number
  sampleCountries: string[]
}

export interface FxRow {
  baseCurrency: string
  quoteCurrency: string
  rate: string | null
  source: string
  fetchedAt: string | null
  /** -1 when never fetched. */
  ageHours: number
  /**
   * True when this rate is too old to price a real charge from. Display conversion still uses it —
   * an approximate label a few percent out beats no label — but zone pricing declines to convert and
   * charges in the mentor's own currency instead.
   */
  staleForCharging: boolean
}

export interface AdminZonePricingSnapshot {
  generatedAt: string

  /** Config echoed live, so a panel reading and a config reading are the same reading. */
  zonePricingEnabled: boolean
  displayConversionEnabled: boolean
  guardrailMinMultiplier: number
  guardrailMaxMultiplier: number
  fallbackZoneCode: string
  quoteTtlMinutes: number
  fxCacheHours: number
  fxMaxStalenessHours: number
  fxProviderName: string

  zones: ZoneRow[]
  fxRates: FxRow[]

  mappedCountries: number
  servicesWithCountryPricing: number
  servicesWithZoneOverrides: number

  /** Live assertions. **Must always be empty** — a non-empty entry is a real bug. */
  invariantViolations: string[]
  warnings: string[]
}

export interface FxFetchReport {
  basesFetched: number
  ratesStored: number
  failures: number
  errors: string[]
}
