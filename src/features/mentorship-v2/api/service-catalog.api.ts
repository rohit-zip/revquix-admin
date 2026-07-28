/**
 * ─── MENTORSHIP V2 (PHASE 2) SERVICE CATALOG API ─────────────────────────────
 *
 * API calls for AdminMentorshipV2ServiceController. Read-only apart from the sanitiser
 * probe, which computes without persisting anything.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminServiceCatalogSnapshot,
  SanitiserProbeResult,
  ServicePublishCheck,
  ServiceTemplateRow,
  ServiceTypeCapabilityRow,
} from "./service-catalog.types"

const BASE = "/admin/mentorship-v2/services"

export const getServiceCatalogSnapshot = (recentLimit = 25): Promise<AdminServiceCatalogSnapshot> =>
  apiClient
    .get<AdminServiceCatalogSnapshot>(`${BASE}/snapshot`, { params: { recentLimit } })
    .then((r) => r.data)

export const inspectServicePublishGate = (serviceId: string): Promise<ServicePublishCheck> =>
  apiClient
    .get<ServicePublishCheck>(`${BASE}/publish-gate`, { params: { serviceId } })
    .then((r) => r.data)

export const getSanitiserPayloads = (): Promise<string[]> =>
  apiClient.get<string[]>(`${BASE}/sanitiser/payloads`).then((r) => r.data)

export const probeSanitiser = (html: string): Promise<SanitiserProbeResult> =>
  apiClient.post<SanitiserProbeResult>(`${BASE}/sanitiser/probe`, { html }).then((r) => r.data)

export const getServiceTypeRegistry = (): Promise<ServiceTypeCapabilityRow[]> =>
  apiClient.get<ServiceTypeCapabilityRow[]>(`${BASE}/types`).then((r) => r.data)

export const getServiceTemplates = (): Promise<ServiceTemplateRow[]> =>
  apiClient.get<ServiceTemplateRow[]>(`${BASE}/templates`).then((r) => r.data)
