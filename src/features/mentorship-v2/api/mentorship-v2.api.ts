/**
 * ─── MENTORSHIP V2 (PHASE 0) VERIFICATION API ───────────────────────────────
 *
 * API calls for AdminMentorshipV2VerificationController endpoints.
 */

import { apiClient } from "@/lib/axios"
import type {
  FxRateResponse,
  MentorshipV2HealthResponse,
  PricingQuotePreviewRequest,
  PricingQuotePreviewResponse,
  PricingZoneResponse,
} from "./mentorship-v2.types"

const BASE = "/admin/mentorship-v2/verification"

/** GET /admin/mentorship-v2/verification/health */
export const getMentorshipV2Health = (): Promise<MentorshipV2HealthResponse> =>
  apiClient.get<MentorshipV2HealthResponse>(`${BASE}/health`).then((r) => r.data)

/** GET /admin/mentorship-v2/verification/zones */
export const getMentorshipV2Zones = (): Promise<PricingZoneResponse[]> =>
  apiClient.get<PricingZoneResponse[]>(`${BASE}/zones`).then((r) => r.data)

/** GET /admin/mentorship-v2/verification/fx-rates */
export const getMentorshipV2FxRates = (): Promise<FxRateResponse[]> =>
  apiClient.get<FxRateResponse[]>(`${BASE}/fx-rates`).then((r) => r.data)

/** POST /admin/mentorship-v2/verification/pricing-quote/preview */
export const previewMentorshipV2PricingQuote = (
  request: PricingQuotePreviewRequest,
): Promise<PricingQuotePreviewResponse> =>
  apiClient.post<PricingQuotePreviewResponse>(`${BASE}/pricing-quote/preview`, request).then((r) => r.data)

/** GET /admin/mentorship-v2/verification/pricing-quote/recent */
export const getMentorshipV2RecentQuotes = (limit = 10): Promise<PricingQuotePreviewResponse[]> =>
  apiClient
    .get<PricingQuotePreviewResponse[]>(`${BASE}/pricing-quote/recent`, { params: { limit } })
    .then((r) => r.data)
