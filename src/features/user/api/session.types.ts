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
  // Profile
  skills: SkillDto[]
  categories: CategoryDto[]
  authProviders: AuthProviderDto[]
}

// ─── Revoke All Result ────────────────────────────────────────────────────────

export interface RevokeAllResult {
  message: string
  revokedCount: number
}

export interface CurrentSessionIdResponse {
  sessionId?: string
}


