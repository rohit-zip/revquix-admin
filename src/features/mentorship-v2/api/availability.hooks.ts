/**
 * ─── MENTORSHIP V2 (PHASE 1) AVAILABILITY HOOKS ─────────────────────────────
 *
 * React Query hooks for AdminMentorshipV2AvailabilityController.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  createManualInterval,
  inspectAvailability,
  listAvailabilityAudit,
  listAvailabilityMentors,
  listBookedIntervals,
  releaseBookedInterval,
} from "./availability.api"
import type { ManualBookedIntervalRequest } from "./availability.types"

export const availabilityKeys = {
  mentors: ["mentorship-v2", "availability", "mentors"] as const,
  inspect: (mentor: string, durationMinutes: number, from?: string, to?: string) =>
    ["mentorship-v2", "availability", "inspect", mentor, durationMinutes, from ?? null, to ?? null] as const,
  intervals: (mentor: string) => ["mentorship-v2", "availability", "intervals", mentor] as const,
  audit: (mentor: string | undefined, limit: number) =>
    ["mentorship-v2", "availability", "audit", mentor ?? "ALL", limit] as const,
}

/** Every mentor with a V2 availability configuration, with health numbers. */
export function useAvailabilityMentors() {
  return useQuery({
    queryKey: availabilityKeys.mentors,
    queryFn: listAvailabilityMentors,
  })
}

/**
 * Runs the engine for a mentor. Disabled until a mentor is chosen, so opening the
 * page does not fire a computation against nobody.
 */
export function useInspectAvailability(
  mentor: string,
  durationMinutes: number,
  from?: string,
  to?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: availabilityKeys.inspect(mentor, durationMinutes, from, to),
    queryFn: () =>
      inspectAvailability({
        mentor,
        durationMinutes,
        from,
        to,
        timezone:
          typeof window === "undefined" ? undefined : Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    enabled: enabled && mentor.trim().length > 0,
    retry: false,
  })
}

export function useBookedIntervals(mentor: string, enabled = true) {
  return useQuery({
    queryKey: availabilityKeys.intervals(mentor),
    queryFn: () => listBookedIntervals(mentor),
    enabled: enabled && mentor.trim().length > 0,
    retry: false,
  })
}

export function useAvailabilityAudit(mentor: string | undefined, limit = 25) {
  return useQuery({
    queryKey: availabilityKeys.audit(mentor, limit),
    queryFn: () => listAvailabilityAudit(mentor, limit),
    retry: false,
  })
}

/**
 * Creates a MANUAL busy interval.
 *
 * `retry: false` matters here: this endpoint is used specifically to trip the
 * exclusion constraint, and a silent retry of a 409 would muddy the very signal
 * the tool exists to show.
 */
export function useCreateManualInterval(mentor: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: ManualBookedIntervalRequest) => createManualInterval(mentor, request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Interval created")
      void qc.invalidateQueries({ queryKey: ["mentorship-v2", "availability"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useReleaseInterval(mentor: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (intervalId: string) => releaseBookedInterval(mentor, intervalId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Interval released")
      void qc.invalidateQueries({ queryKey: ["mentorship-v2", "availability"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
