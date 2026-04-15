"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import * as api from "./website-admin.api"
import type {
  CreateTemplateRequest, UpdateTemplatePricingRequest, CreateComponentRequest,
  UpdatePricingRequest, SuspendWebsiteRequest,
} from "./website-admin.types"

export const websiteAdminKeys = {
  templates: ["admin", "website", "templates"] as const,
  template: (id: string) => ["admin", "website", "templates", id] as const,
  components: ["admin", "website", "components"] as const,
  component: (id: string) => ["admin", "website", "components", id] as const,
  pricing: ["admin", "website", "pricing"] as const,
  watermark: ["admin", "website", "watermark"] as const,
  websites: (params: object) => ["admin", "website", "websites", params] as const,
  website: (id: string) => ["admin", "website", "websites", id] as const,
  subscriptions: (params: object) => ["admin", "website", "subscriptions", params] as const,
  stats: ["admin", "website", "stats"] as const,
}

export function useAdminTemplates() {
  return useQuery({ queryKey: websiteAdminKeys.templates, queryFn: api.getAdminTemplates })
}

export function useAdminTemplate(id: string) {
  return useQuery({ queryKey: websiteAdminKeys.template(id), queryFn: () => api.getAdminTemplate(id), enabled: !!id })
}

export function useCreateTemplate(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTemplateRequest) => api.createTemplate(request),
    onSuccess: () => {
      showSuccessToast("Template created")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.templates })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: Partial<CreateTemplateRequest>) => api.updateTemplate(id, request),
    onSuccess: () => {
      showSuccessToast("Template updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.templates })
      qc.invalidateQueries({ queryKey: websiteAdminKeys.template(id) })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUpdateTemplatePricing(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateTemplatePricingRequest) => api.updateTemplatePricing(id, request),
    onSuccess: () => {
      showSuccessToast("Template pricing updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.templates })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useToggleTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.toggleTemplate(id),
    onSuccess: () => {
      showSuccessToast("Template status updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.templates })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminComponents() {
  return useQuery({ queryKey: websiteAdminKeys.components, queryFn: api.getAdminComponents })
}

export function useAdminComponent(id: string) {
  return useQuery({ queryKey: websiteAdminKeys.component(id), queryFn: () => api.getAdminComponent(id), enabled: !!id })
}

export function useCreateComponent(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateComponentRequest) => api.createComponent(request),
    onSuccess: () => {
      showSuccessToast("Component created")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.components })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUpdateComponent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: Partial<CreateComponentRequest>) => api.updateComponent(id, request),
    onSuccess: () => {
      showSuccessToast("Component updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.components })
      qc.invalidateQueries({ queryKey: websiteAdminKeys.component(id) })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useToggleComponent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.toggleComponent(id),
    onSuccess: () => {
      showSuccessToast("Component status updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.components })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function usePlatformPricing() {
  return useQuery({ queryKey: websiteAdminKeys.pricing, queryFn: api.getPlatformPricing })
}

export function useUpdatePlatformPricing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, request }: { key: string; request: UpdatePricingRequest }) => api.updatePlatformPricing(key, request),
    onSuccess: () => {
      showSuccessToast("Pricing updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.pricing })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useWatermarkConfig() {
  return useQuery({ queryKey: websiteAdminKeys.watermark, queryFn: api.getWatermarkConfig })
}

export function useUpdateWatermarkConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateWatermarkConfig,
    onSuccess: () => {
      showSuccessToast("Watermark config updated")
      qc.invalidateQueries({ queryKey: websiteAdminKeys.watermark })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminWebsites(params: { page?: number; size?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: websiteAdminKeys.websites(params),
    queryFn: () => api.searchAdminWebsites(params),
  })
}

export function useSuspendWebsite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SuspendWebsiteRequest }) => api.suspendWebsite(id, request),
    onSuccess: () => {
      showSuccessToast("Website suspended")
      qc.invalidateQueries({ queryKey: ["admin", "website", "websites"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUnsuspendWebsite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.unsuspendWebsite(id),
    onSuccess: () => {
      showSuccessToast("Website unsuspended")
      qc.invalidateQueries({ queryKey: ["admin", "website", "websites"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminSubscriptions(params: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: websiteAdminKeys.subscriptions(params),
    queryFn: () => api.getAdminSubscriptions(params),
  })
}

export function useExtendSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => api.extendSubscription(id, days),
    onSuccess: () => {
      showSuccessToast("Subscription extended")
      qc.invalidateQueries({ queryKey: ["admin", "website", "subscriptions"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function usePlatformStats() {
  return useQuery({ queryKey: websiteAdminKeys.stats, queryFn: api.getPlatformStats })
}

