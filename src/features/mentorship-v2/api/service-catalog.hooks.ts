/**
 * ─── MENTORSHIP V2 (PHASE 2) SERVICE CATALOG HOOKS ──────────────────────────
 */

"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { showErrorToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getSanitiserPayloads,
  getServiceCatalogSnapshot,
  getServiceTemplates,
  getServiceTypeRegistry,
  inspectServicePublishGate,
  probeSanitiser,
} from "./service-catalog.api"

export const serviceCatalogKeys = {
  snapshot: (limit: number) => ["mentorship-v2", "service-catalog", "snapshot", limit] as const,
  publishGate: (serviceId: string) =>
    ["mentorship-v2", "service-catalog", "publish-gate", serviceId] as const,
  payloads: ["mentorship-v2", "service-catalog", "sanitiser-payloads"] as const,
  types: ["mentorship-v2", "service-catalog", "types"] as const,
  templates: ["mentorship-v2", "service-catalog", "templates"] as const,
}

export function useServiceCatalogSnapshot(recentLimit = 25) {
  return useQuery({
    queryKey: serviceCatalogKeys.snapshot(recentLimit),
    queryFn: () => getServiceCatalogSnapshot(recentLimit),
  })
}

export function useServicePublishGate(serviceId: string) {
  return useQuery({
    queryKey: serviceCatalogKeys.publishGate(serviceId),
    queryFn: () => inspectServicePublishGate(serviceId),
    enabled: serviceId.trim().length > 0,
    retry: false,
  })
}

export function useSanitiserPayloads() {
  return useQuery({
    queryKey: serviceCatalogKeys.payloads,
    queryFn: getSanitiserPayloads,
    staleTime: 60 * 60 * 1000,
  })
}

export function useServiceTypeRegistry() {
  return useQuery({
    queryKey: serviceCatalogKeys.types,
    queryFn: getServiceTypeRegistry,
  })
}

export function useServiceTemplateRows() {
  return useQuery({
    queryKey: serviceCatalogKeys.templates,
    queryFn: getServiceTemplates,
    staleTime: 60 * 60 * 1000,
  })
}

/**
 * `retry: false` matters here — the probe is being used to observe exact behaviour, and a
 * silent retry would muddy which response corresponds to which input.
 */
export function useSanitiserProbe() {
  return useMutation({
    mutationFn: (html: string) => probeSanitiser(html),
    retry: false,
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
