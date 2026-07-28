/**
 * ─── MENTORSHIP V2 (PHASE 8) PRICING ADMIN API ────────────────────────────────
 *
 * Backs `AdminMentorshipV2PricingController`.
 *
 * Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; every write needs Phase 3's
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`. No new permission was added for this phase — retuning a zone
 * multiplier is a commerce-configuration action of exactly the kind that permission exists for.
 */

import { apiClient } from "@/lib/axios"
import type { AdminZonePricingSnapshot, FxFetchReport } from "./pricing.types"

const BASE = "/admin/mentorship-v2/pricing"

export const getPricingSnapshot = (): Promise<AdminZonePricingSnapshot> =>
  apiClient.get<AdminZonePricingSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

/** Every field is optional; omitted ones are left as they are. Returns the refreshed snapshot. */
export const updateZone = (
  zoneCode: string,
  params: {
    defaultMultiplier?: string
    label?: string
    displayCurrency?: string
    active?: boolean
  },
): Promise<AdminZonePricingSnapshot> =>
  apiClient
    .put<AdminZonePricingSnapshot>(`${BASE}/zones/${zoneCode}`, undefined, { params })
    .then((r) => r.data)

export const mapCountry = (
  countryCode: string,
  zoneCode: string,
): Promise<AdminZonePricingSnapshot> =>
  apiClient
    .put<AdminZonePricingSnapshot>(`${BASE}/countries/${countryCode}`, undefined, {
      params: { zoneCode },
    })
    .then((r) => r.data)

export const unmapCountry = (countryCode: string): Promise<AdminZonePricingSnapshot> =>
  apiClient.delete<AdminZonePricingSnapshot>(`${BASE}/countries/${countryCode}`).then((r) => r.data)

export const refreshFxRates = (): Promise<FxFetchReport> =>
  apiClient.post<FxFetchReport>(`${BASE}/fx/refresh`).then((r) => r.data)
