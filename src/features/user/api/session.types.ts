/**
 * ─── USER SESSION TYPES ───────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend UserSessionResponse and
 * AdminUserDetailResponse DTOs.
 */

// ─── Session ──────────────────────────────────────────────────────────────────

export interface UserSessionResponse {
  sessionId: string
  deviceType: string | null
  browser: string | null
  os: string | null
  rawUserAgent: string | null
  ipAddress: string | null
  location: string | null
  issuedAt: string
  expiresAt: string
  lastUsedAt: string | null
  isRevoked: boolean
  revokedAt: string | null
  revokedBy: string | null
  isCurrent: boolean
}

export interface SessionHistoryPage {
  content: UserSessionResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

// ─── Admin User Detail ────────────────────────────────────────────────────────

export interface SkillDto {
  skillId: string
  name: string
  description: string | null
  categoryId: string | null
  iconUrl: string | null
}

export interface CategoryDto {
  categoryId: string
  name: string
  description: string | null
}

export interface AuthProviderDto {
  provider: string
  providerUserId: string
  displayName: string | null
  email: string | null
  linkedAt: string
}

export type AdminProjectType =
  | "PERSONAL"
  | "PROFESSIONAL"
  | "OPEN_SOURCE"
  | "ACADEMIC"
  | "FREELANCE"
  | "HACKATHON"
  | "OTHER"

export type AdminProjectStatus = "IN_PROGRESS" | "COMPLETED" | "ARCHIVED"

export type AdminProjectModerationStatus = "VISIBLE" | "HIDDEN"

export interface AdminProjectMedia {
  mediaId: string
  url: string | null
  displayOrder: number | null
  isPrimary: boolean | null
  width: number | null
  height: number | null
}

export interface AdminProjectResponse {
  projectId: string
  title: string
  description: string | null
  roleInProject: string | null
  projectType: AdminProjectType | null
  projectTypeLabel: string | null
  status: AdminProjectStatus | null
  statusLabel: string | null
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  isOngoing: boolean | null
  liveUrl: string | null
  sourceUrl: string | null
  displayOrder: number | null
  moderationStatus: AdminProjectModerationStatus | null
  skills: SkillDto[]
  media: AdminProjectMedia[]
  createdAt: string
  updatedAt: string
}

export interface CompanyDto {
  companyId: string
  name: string
  domain: string | null
  logoUrl: string | null
  isVerified: boolean | null
}

export interface SchoolDto {
  schoolId: string
  name: string
  shortName: string | null
  domain: string | null
  logoUrl: string | null
  country: string | null
  isVerified: boolean | null
}

export interface ExperienceResponse {
  experienceId: string
  role: string
  company: CompanyDto | null
  employmentType: string | null
  employmentTypeLabel: string | null
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  isCurrent: boolean | null
  description: string | null
  location: string | null
  skills: SkillDto[]
  createdAt: string
  updatedAt: string
}

export interface EducationResponse {
  educationId: string
  school: SchoolDto | null
  degree: string | null
  degreeLabel: string | null
  fieldOfStudy: string | null
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  isCurrent: boolean | null
  description: string | null
  grade: string | null
  activities: string | null
  skills: SkillDto[]
  createdAt: string
  updatedAt: string
}

export interface UserLinkResponse {
  linkId: string
  url: string
  caption: string | null
  displayOrder: number | null
  createdAt: string
}

export interface BadgeView {
  key: string
  label: string
  shortDescription: string | null
  longDescription: string | null
  colorKey: string
  iconKey: string
  precedence: number
  source: string
  grantedAt: string | null
  expiresAt: string | null
}

export interface AdminBadgeView {
  userBadgeId: string | null
  key: string
  label: string
  shortDescription: string | null
  colorKey: string
  iconKey: string
  source: string
  manuallyGrantable: boolean
  grantedBy: string | null
  grantedAt: string | null
  reason: string | null
  expiresAt: string | null
  revokedAt: string | null
  revokedBy: string | null
  revokeReason: string | null
  active: boolean
}

export interface GrantBadgeRequest {
  badgeKey: string
  reason: string
  expiresAt?: string | null
}

export interface UpdateSeoPriorityRequest {
  seoPriorityOverride?: number | null
  searchBoostOverride?: number | null
  noindex?: boolean | null
  reason?: string | null
}

export interface AdminUserDetailResponse {
  userId: string
  email: string
  username: string | null
  name: string | null
  avatarUrl: string | null
  mobile: string | null
  isEmailVerified: boolean
  isAccountNonLocked: boolean
  isEnabled: boolean
  isDeleted: boolean
  passwordChangeRequired: boolean
  failedLoginAttempts: number
  // Admin-only PII
  registerIp: string | null
  lastLoginIp: string | null
  // Financial
  freeCallsUsed: number
  // Timestamps
  lastLoginAt: string | null
  lastPasswordChangeAt: string | null
  lastUsernameChangeAt: string | null
  accountLockedUntil: string | null
  deletedAt: string | null
  lastLoginFailedAt: string | null
  createdAt: string
  updatedAt: string
  // Authorization
  roles: string[]
  // Public profile
  headline: string | null
  bio: string | null
  location: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  yearsOfExperience: number | null
  currentCompany: string | null
  currentRole: string | null
  // Profile
  skills: SkillDto[]
  categories: CategoryDto[]
  projects: AdminProjectResponse[]
  experiences: ExperienceResponse[]
  educations: EducationResponse[]
  links: UserLinkResponse[]
  authProviders: AuthProviderDto[]
  // Badges & discovery visibility
  badges?: AdminBadgeView[]
  primaryBadge?: BadgeView | null
  badgeRank?: number | null
  seoPriority?: number | null
  seoPriorityOverride?: number | null
  searchBoost?: number | null
  searchBoostOverride?: number | null
  seoNoindex?: boolean | null
}

// ─── Revoke All Result ────────────────────────────────────────────────────────

export interface RevokeAllResult {
  message: string
  revokedCount: number
}

export interface CurrentSessionIdResponse {
  sessionId?: string
}


