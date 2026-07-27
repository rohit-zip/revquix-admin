import { apiClient } from "@/lib/axios"
import type {
  AdminSkill,
  AdminSkillListParams,
  AdminSkillRequest,
  DeleteSkillResult,
  SkillGroupLabel,
  SpringPage,
} from "./skill.types"

const ADMIN_SKILLS = "/admin/skills"

// ── Skills CRUD ──────────────────────────────────────────────────────────────

export const listSkills = (params: AdminSkillListParams): Promise<SpringPage<AdminSkill>> =>
  apiClient
    .get<SpringPage<AdminSkill>>(ADMIN_SKILLS, {
      params: {
        ...(params.name ? { name: params.name } : {}),
        ...(params.groupLabel ? { groupLabel: params.groupLabel } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    })
    .then((r) => r.data)

export const getSkill = (skillId: string): Promise<AdminSkill> =>
  apiClient.get<AdminSkill>(`${ADMIN_SKILLS}/${skillId}`).then((r) => r.data)

export const createSkill = (request: AdminSkillRequest): Promise<AdminSkill> =>
  apiClient.post<AdminSkill>(ADMIN_SKILLS, request).then((r) => r.data)

export const updateSkill = (skillId: string, request: AdminSkillRequest): Promise<AdminSkill> =>
  apiClient.put<AdminSkill>(`${ADMIN_SKILLS}/${skillId}`, request).then((r) => r.data)

export const deleteSkill = (skillId: string): Promise<DeleteSkillResult> =>
  apiClient.delete<DeleteSkillResult>(`${ADMIN_SKILLS}/${skillId}`).then((r) => r.data)

// ── Group labels (admin-only browsing convenience) ──────────────────────────

export const listSkillGroupLabels = (): Promise<SkillGroupLabel[]> =>
  apiClient.get<SkillGroupLabel[]>(`${ADMIN_SKILLS}/groups`).then((r) => r.data)
