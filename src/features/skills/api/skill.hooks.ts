"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  createSkill,
  deleteSkill,
  getSkill,
  listSkillGroupLabels,
  listSkills,
  updateSkill,
} from "./skill.api"
import type {
  AdminSkill,
  AdminSkillListParams,
  AdminSkillRequest,
  DeleteSkillResult,
} from "./skill.types"

export const skillQueryKeys = {
  all: ["skills"] as const,
  list: (params: AdminSkillListParams) =>
    ["skills", "list", params.page, params.size, params.name, params.groupLabel, params.isActive] as const,
  detail: (skillId: string) => ["skills", "detail", skillId] as const,
  groups: ["skills", "groups"] as const,
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function useSkills(params: AdminSkillListParams) {
  return useQuery({
    queryKey: skillQueryKeys.list(params),
    queryFn: () => listSkills(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}

export function useSkill(skillId: string) {
  return useQuery({
    queryKey: skillQueryKeys.detail(skillId),
    queryFn: () => getSkill(skillId),
    enabled: !!skillId,
  })
}

export function useSkillGroupLabels() {
  return useQuery({
    queryKey: skillQueryKeys.groups,
    queryFn: () => listSkillGroupLabels(),
    staleTime: 60_000,
  })
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function useCreateSkill() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof createSkill>>,
    ApiError | NetworkError,
    AdminSkillRequest
  >({
    mutationFn: (request) => createSkill(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillQueryKeys.all })
      showSuccessToast("Skill created")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateSkill>>,
    ApiError | NetworkError,
    { skillId: string; request: AdminSkillRequest }
  >({
    mutationFn: ({ skillId, request }) => updateSkill(skillId, request),
    onSuccess: (data: AdminSkill) => {
      queryClient.setQueryData(skillQueryKeys.detail(data.skillId), data)
      queryClient.invalidateQueries({ queryKey: skillQueryKeys.all })
      showSuccessToast("Skill updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()
  return useMutation<DeleteSkillResult, ApiError | NetworkError, string>({
    mutationFn: (skillId) => deleteSkill(skillId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: skillQueryKeys.all })
      showSuccessToast(
        data.preservedReferenceCount > 0
          ? `Skill deleted (${data.preservedReferenceCount} existing reference${data.preservedReferenceCount === 1 ? "" : "s"} preserved)`
          : "Skill deleted",
      )
    },
    onError: (err) => showErrorToast(err),
  })
}
