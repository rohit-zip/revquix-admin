import { apiClient } from "@/lib/axios"
import type {
  AdminTemplateResponse, AdminComponentResponse, AdminPlatformPricingResponse,
  WatermarkConfigResponse, AdminWebsiteResponse, AdminSubscriptionResponse,
  AdminPlatformStatsResponse, CreateTemplateRequest, UpdateTemplatePricingRequest,
  CreateComponentRequest, UpdatePricingRequest, SuspendWebsiteRequest,
} from "./website-admin.types"

const BASE = "/website/admin"

export const getAdminTemplates = (): Promise<AdminTemplateResponse[]> =>
  apiClient.get<AdminTemplateResponse[]>(`${BASE}/templates`).then((r) => r.data)

export const getAdminTemplate = (id: string): Promise<AdminTemplateResponse> =>
  apiClient.get<AdminTemplateResponse>(`${BASE}/templates/${id}`).then((r) => r.data)

export const createTemplate = (request: CreateTemplateRequest): Promise<AdminTemplateResponse> =>
  apiClient.post<AdminTemplateResponse>(`${BASE}/templates`, request).then((r) => r.data)

export const updateTemplate = (id: string, request: Partial<CreateTemplateRequest>): Promise<AdminTemplateResponse> =>
  apiClient.put<AdminTemplateResponse>(`${BASE}/templates/${id}`, request).then((r) => r.data)

export const updateTemplatePricing = (id: string, request: UpdateTemplatePricingRequest): Promise<AdminTemplateResponse> =>
  apiClient.put<AdminTemplateResponse>(`${BASE}/templates/${id}/pricing`, request).then((r) => r.data)

export const toggleTemplate = (id: string): Promise<AdminTemplateResponse> =>
  apiClient.put<AdminTemplateResponse>(`${BASE}/templates/${id}/toggle`).then((r) => r.data)

export const getAdminComponents = (): Promise<AdminComponentResponse[]> =>
  apiClient.get<AdminComponentResponse[]>(`${BASE}/components`).then((r) => r.data)

export const getAdminComponent = (id: string): Promise<AdminComponentResponse> =>
  apiClient.get<AdminComponentResponse>(`${BASE}/components/${id}`).then((r) => r.data)

export const createComponent = (request: CreateComponentRequest): Promise<AdminComponentResponse> =>
  apiClient.post<AdminComponentResponse>(`${BASE}/components`, request).then((r) => r.data)

export const updateComponent = (id: string, request: Partial<CreateComponentRequest>): Promise<AdminComponentResponse> =>
  apiClient.put<AdminComponentResponse>(`${BASE}/components/${id}`, request).then((r) => r.data)

export const updateComponentPricing = (id: string, priceInrPaise: number, priceUsdCents: number): Promise<AdminComponentResponse> =>
  apiClient.put<AdminComponentResponse>(`${BASE}/components/${id}/pricing`, { priceInrPaise, priceUsdCents }).then((r) => r.data)

export const toggleComponent = (id: string): Promise<AdminComponentResponse> =>
  apiClient.put<AdminComponentResponse>(`${BASE}/components/${id}/toggle`).then((r) => r.data)

export const getPlatformPricing = (): Promise<AdminPlatformPricingResponse[]> =>
  apiClient.get<AdminPlatformPricingResponse[]>(`${BASE}/pricing`).then((r) => r.data)

export const updatePlatformPricing = (key: string, request: UpdatePricingRequest): Promise<AdminPlatformPricingResponse> =>
  apiClient.put<AdminPlatformPricingResponse>(`${BASE}/pricing/${key}`, request).then((r) => r.data)

export const getWatermarkConfig = (): Promise<WatermarkConfigResponse> =>
  apiClient.get<WatermarkConfigResponse>(`${BASE}/watermark/config`).then((r) => r.data)

export const updateWatermarkConfig = (config: Partial<WatermarkConfigResponse>): Promise<WatermarkConfigResponse> =>
  apiClient.put<WatermarkConfigResponse>(`${BASE}/watermark/config`, config).then((r) => r.data)

export const searchAdminWebsites = (
  params: { page?: number; size?: number; status?: string; search?: string }
): Promise<{ content: AdminWebsiteResponse[]; totalElements: number; totalPages: number }> =>
  apiClient.get(`${BASE}/websites`, { params }).then((r) => r.data)

export const getAdminWebsite = (id: string): Promise<AdminWebsiteResponse> =>
  apiClient.get<AdminWebsiteResponse>(`${BASE}/websites/${id}`).then((r) => r.data)

export const suspendWebsite = (id: string, request: SuspendWebsiteRequest): Promise<AdminWebsiteResponse> =>
  apiClient.post<AdminWebsiteResponse>(`${BASE}/websites/${id}/suspend`, request).then((r) => r.data)

export const unsuspendWebsite = (id: string): Promise<AdminWebsiteResponse> =>
  apiClient.post<AdminWebsiteResponse>(`${BASE}/websites/${id}/unsuspend`).then((r) => r.data)

export const getAdminSubscriptions = (
  params: { page?: number; size?: number; status?: string }
): Promise<{ content: AdminSubscriptionResponse[]; totalElements: number; totalPages: number }> =>
  apiClient.get(`${BASE}/subscriptions`, { params }).then((r) => r.data)

export const extendSubscription = (id: string, days: number): Promise<AdminSubscriptionResponse> =>
  apiClient.post<AdminSubscriptionResponse>(`${BASE}/subscriptions/${id}/extend`, { days }).then((r) => r.data)

export const getPlatformStats = (): Promise<AdminPlatformStatsResponse> =>
  apiClient.get<AdminPlatformStatsResponse>(`${BASE}/stats`).then((r) => r.data)

