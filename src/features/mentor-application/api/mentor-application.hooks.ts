/**
 * ─── MENTOR APPLICATION HOOKS ────────────────────────────────────────────────
 *
 * React Query hooks for MentorApplicationController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { MentorApplicationRejectRequest, MentorApplicationRequest, ApplicationLimits } from "./mentor-application.types"
import {
  applyMentor,
  approveApplication,
  getApplicationById,
  getCategorySkillLimits,
  getMyApplication,
  getMyApplicationHistory,
  permanentlyRejectApplication,
  rejectApplication,
  revokeMentor,
  withdrawApplication,
} from "./mentor-application.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const applicationKeys = {
  my: ["mentor-application", "my"] as const,
  myHistory: ["mentor-application", "my-history"] as const,
  search: ["mentor-application", "search"] as const,
  detail: (id: string) => ["mentor-application", id] as const,
  limits: ["mentor-application", "limits"] as const,
}

// ─── User Queries ─────────────────────────────────────────────────────────────

export function useMyApplication() {
  return useQuery({
    queryKey: applicationKeys.my,
    queryFn: getMyApplication,
  })
}

export function useMyApplicationHistory() {
  return useQuery({
    queryKey: applicationKeys.myHistory,
    queryFn: getMyApplicationHistory,
  })
}

export function useApplicationDetail(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => getApplicationById(id),
    enabled: !!id,
  })
}

export function useCategorySkillLimits() {
  return useQuery<ApplicationLimits>({
    queryKey: applicationKeys.limits,
    queryFn: getCategorySkillLimits,
    staleTime: 1000 * 60 * 30, // 30 minutes — limits rarely change
  })
}

// ─── User Mutations ───────────────────────────────────────────────────────────

export function useApplyMentor(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, resume }: { data: MentorApplicationRequest; resume: File }) =>
      applyMentor(data, resume),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Mentor application submitted successfully!")
      qc.invalidateQueries({ queryKey: applicationKeys.my })
      qc.invalidateQueries({ queryKey: applicationKeys.myHistory })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useWithdrawApplication(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: withdrawApplication,
    retry: false,
    onSuccess: () => {
      showSuccessToast("Application withdrawn successfully")
      qc.invalidateQueries({ queryKey: applicationKeys.my })
      qc.invalidateQueries({ queryKey: applicationKeys.myHistory })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Admin Mutations ──────────────────────────────────────────────────────────

export function useApproveApplication(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveApplication(id),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Application approved! Mentor role assigned.")
      qc.invalidateQueries({ queryKey: applicationKeys.search })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useRejectApplication(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MentorApplicationRejectRequest }) =>
      rejectApplication(id, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Application rejected")
      qc.invalidateQueries({ queryKey: applicationKeys.search })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function usePermanentlyRejectApplication(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MentorApplicationRejectRequest }) =>
      permanentlyRejectApplication(id, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Application permanently rejected")
      qc.invalidateQueries({ queryKey: applicationKeys.search })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useRevokeMentor(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => revokeMentor(userId),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(data.message)
      qc.invalidateQueries({ queryKey: applicationKeys.search })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

