/**
 * ─── USER SEARCH TYPES ───────────────────────────────────────────────────────
 *
 * Types specific to the admin user search endpoint (POST /api/v1/user/search).
 */

/** Shape of each user object returned by the search endpoint */
export interface AdminUserResponse {
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
  lastLoginAt: string | null
  lastPasswordChangeAt: string | null
  lastUsernameChangeAt: string | null
  accountLockedUntil: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  roles: string[]
}

