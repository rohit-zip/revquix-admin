/**
 * ─── ADMIN COMPANY TYPES ──────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend AdminCompanyResponse
 * and AdminUpdateCompanyRequest DTOs.
 */

export interface AdminCompanyResponse {
  companyId: string
  name: string
  domain: string | null
  logoUrl: string | null
  isVerified: boolean
  isActive: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminUpdateCompanyRequest {
  name?: string | null
  domain?: string | null
  logoUrl?: string | null
  isVerified?: boolean | null
  isActive?: boolean | null
}
