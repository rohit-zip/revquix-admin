/**
 * Types for the admin Skill CRUD feature — Phase 2 of the Skill-only taxonomy
 * migration (see docs/SKILL_ONLY_TAXONOMY_PLAN.md §5).
 *
 * Mirrors the backend shapes exactly:
 * - AdminSkillResponse.java  -> AdminSkill
 * - AdminSkillRequest.java   -> AdminSkillRequest
 * - CategoryDto.java (as returned by GET /admin/skills/groups) -> SkillGroupLabel
 */

export interface AdminSkill {
  skillId: string
  name: string
  description: string | null
  iconUrl: string | null
  /** Admin-only grouping label id, or null if ungrouped. Never a user-facing concept. */
  groupLabel: string | null
  /** Admin-only grouping label display name, or null if ungrouped. */
  groupLabelName: string | null
  displayOrder: number
  isActive: boolean
  isDeleted: boolean
  /** Total reference count across every table that tags against this skill. */
  totalUsageCount: number
  createdAt?: string
  updatedAt?: string
}

export interface AdminSkillRequest {
  name: string
  description?: string | null
  iconUrl?: string | null
  groupLabel?: string | null
  displayOrder?: number | null
  isActive?: boolean | null
}

export interface SkillGroupLabel {
  categoryId: string
  name: string
  description: string | null
}

export interface AdminSkillListParams {
  name?: string
  groupLabel?: string
  isActive?: boolean
  page?: number
  size?: number
}

/** Shape of a Spring Data Page<T> as returned by GET /admin/skills. */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface DeleteSkillResult {
  skillId: string
  isDeleted: true
  /** Reference count preserved (not removed) across every table at the time of deletion. */
  preservedReferenceCount: number
}
