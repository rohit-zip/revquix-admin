/**
 * ─── ADMIN SCHOOL TYPES ───────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend AdminSchoolResponse
 * and AdminUpdateSchoolRequest DTOs.
 */

export interface AdminSchoolResponse {
  schoolId: string
  name: string
  shortName: string | null
  domain: string | null
  logoUrl: string | null
  websiteUrl: string | null
  city: string | null
  country: string | null
  isVerified: boolean
  isActive: boolean
  userCount: number        // count of user_education entries referencing this school
  createdAt: string
  updatedAt: string
}

export interface AdminUpdateSchoolRequest {
  name?: string | null
  shortName?: string | null
  domain?: string | null
  logoUrl?: string | null
  websiteUrl?: string | null
  city?: string | null
  country?: string | null
  isVerified?: boolean | null
  isActive?: boolean | null
}
