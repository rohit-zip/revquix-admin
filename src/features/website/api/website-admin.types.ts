export type TemplateType = "SINGLE_PAGE" | "MULTI_PAGE"
export type ComponentCategory = "HERO" | "NAVIGATION" | "CONTENT" | "FORM" | "FOOTER" | "DECORATION" | "ADVANCED"
export type SubscriptionStatus = "PENDING_PAYMENT" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED"
export type WebsiteStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED" | "EXPIRED"

export interface LayoutItem {
  instanceId: string
  sectionKey: string | null
  componentSlug: string
  props: Record<string, unknown>
  order: number
}

export interface AdminTemplateResponse {
  templateId: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  previewUrl: string | null
  templateType: TemplateType
  isFree: boolean
  priceInrPaise: number
  priceUsdCents: number
  yearlyDiscountPercent: number
  isActive: boolean
  isFeatured: boolean
  displayOrder: number
  contentSchema: unknown
  defaultLayout: LayoutItem[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminComponentResponse {
  componentId: string
  name: string
  slug: string
  description: string | null
  category: ComponentCategory
  thumbnailUrl: string | null
  isFree: boolean
  priceInrPaise: number
  priceUsdCents: number
  propsSchema: unknown
  defaultProps: Record<string, unknown>
  isActive: boolean
  displayOrder: number
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminPlatformPricingResponse {
  pricingKey: string
  displayName: string
  description: string
  priceInrPaise: number
  priceUsdCents: number
  isEnabled: boolean
  updatedAt: string
}

export interface WatermarkConfigResponse {
  text: string
  logoUrl: string | null
  linkUrl: string
  isActive: boolean
}

export interface AdminWebsiteResponse {
  websiteId: string
  subdomain: string
  customDomain: string | null
  siteTitle: string | null
  status: WebsiteStatus
  isMultiPage: boolean
  analyticsEnabled: boolean
  contactFormEnabled: boolean
  watermarkRemoved: boolean
  isMaintenance: boolean
  templateName: string | null
  userId: string
  userName: string
  userEmail: string
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminSubscriptionResponse {
  subscriptionId: string
  websiteId: string
  subdomain: string
  userName: string
  userEmail: string
  planType: string
  status: SubscriptionStatus
  totalAmountInrPaise: number
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string | null
  autoRenew: boolean
  createdAt: string
}

export interface AdminPlatformStatsResponse {
  totalWebsites: number
  publishedWebsites: number
  suspendedWebsites: number
  expiredWebsites: number
  totalActiveSubscriptions: number
  totalMrrInrPaise: number
  totalCustomDomains: number
  totalWatermarkRemovals: number
  totalContactSubmissions: number
  totalPageViews30d: number
  cloudflareSlotsUsed: number
  cloudflareSlotsFree: number
  watermarkClickThroughs: number
}

export interface CreateTemplateRequest {
  categoryId: string
  name: string
  slug: string
  description?: string
  templateType: TemplateType
  isFree: boolean
  priceInrPaise: number
  priceUsdCents: number
  yearlyDiscountPercent?: number
  isFeatured?: boolean
  isActive?: boolean
  displayOrder?: number
  previewUrl?: string
  contentSchema?: unknown
  defaultLayout?: LayoutItem[]
}

export interface UpdateTemplatePricingRequest {
  priceInrPaise: number
  priceUsdCents: number
  yearlyDiscountPercent?: number
  isFree?: boolean
}

export interface CreateComponentRequest {
  name: string
  slug: string
  description?: string
  category: ComponentCategory
  isFree: boolean
  priceInrPaise: number
  priceUsdCents: number
  isActive?: boolean
  displayOrder?: number
  propsSchema?: unknown
  defaultProps?: Record<string, unknown>
}

export interface UpdatePricingRequest {
  priceInrPaise: number
  priceUsdCents: number
  isEnabled?: boolean
}

export interface SuspendWebsiteRequest {
  reason: string
}

