export interface Permission {
  permissionId: string
  permissionName: string
  description: string
}

export interface Role {
  roleId: string
  name: string
  description: string
  isSystemRole: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface Skill {
  skillId: string
  name: string
  description: string
  categoryId: string | null
  iconUrl: string | null
}

export interface Category {
  categoryId: string
  name: string
  description: string
}

export interface CategoryWithSkills {
  categoryId: string
  name: string
  description: string | null
  iconUrl: string | null
  displayOrder: number
  skills: Skill[]
}

export interface RemoveCategoryWarning {
  categoryId: string
  categoryName: string
  affectedSkillCount: number
  affectedSkills: Skill[]
  hasAffectedSkills: boolean
}

export interface CurrentUserResponse {
  userId: string
  email: string
  username: string | null
  name: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
  isAccountNonLocked: boolean
  isEnabled: boolean
  roles: Role[]
  lastLoginAt: string
  lastLoginIp: string
  createdAt: string
  updatedAt: string
  skills: Skill[]
  categories: Category[]
  authorities: string[]
  /** Whether the user has a password set. False for pure OAuth2/Email-OTP accounts. */
  hasPassword: boolean
}

export interface UpdateNameRequest {
  name: string
}

export interface AvatarUploadResponse {
  avatarUrl: string
  message: string
}

export interface UpdateUsernameRequest {
  newUsername: string
}

export interface UpdateUserCategoriesRequest {
  categoryIds: string[]
}

export interface UpdateUserSkillsRequest {
  skillIds: string[]
}

export type UsernameAvailabilityReason =
  | "AVAILABLE"
  | "ON_HOLD"
  | "INVALID_FORMAT"
  | string

export interface UsernameAvailabilityResponse {
  username: string
  available: boolean
  reason: UsernameAvailabilityReason
  availableAt?: string | null
  validationMessage?: string | null
}

