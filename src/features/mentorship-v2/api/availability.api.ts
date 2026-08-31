/**
 * ─── MENTORSHIP V2 (PHASE 1) AVAILABILITY API ───────────────────────────────
 *
 * API calls for AdminMentorshipV2AvailabilityController.
 *
 * `mentor` accepts either a userId or a username — the server tries the userId
 * first, so whichever identifier the admin has to hand works.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminAvailabilityMentorSummary,
  AvailabilityAuditResponse,
  AvailabilityHealthResponse,
  BookableStartsResponse,
  ManualBookedIntervalRequest,
  MentorBookedIntervalResponse,
} from "./availability.types"

const BASE = "/admin/mentorship-v2/availability"

/** GET /inspect — runs the engine uncached and returns the full step trace. */
export const inspectAvailability = (params: {
  mentor: string
  durationMinutes: number
  from?: string
  to?: string
  timezone?: string
}): Promise<BookableStartsResponse> =>
  apiClient.get<BookableStartsResponse>(`${BASE}/inspect`, { params }).then((r) => r.data)

/** GET /health — one mentor's availability health. */
export const getMentorAvailabilityHealth = (mentor: string): Promise<AvailabilityHealthResponse> =>
  apiClient
    .get<AvailabilityHealthResponse>(`${BASE}/health`, { params: { mentor } })
    .then((r) => r.data)

/** GET /mentors — every mentor with a V2 availability configuration. */
export const listAvailabilityMentors = (): Promise<AdminAvailabilityMentorSummary[]> =>
  apiClient.get<AdminAvailabilityMentorSummary[]>(`${BASE}/mentors`).then((r) => r.data)

/** GET /intervals — a mentor's most recent booked intervals. */
export const listBookedIntervals = (mentor: string): Promise<MentorBookedIntervalResponse[]> =>
  apiClient
    .get<MentorBookedIntervalResponse[]>(`${BASE}/intervals`, { params: { mentor } })
    .then((r) => r.data)

/**
 * POST /intervals — creates a MANUAL busy interval.
 * Posting the same range twice is the double-booking test: the second call must
 * return 409 (RQ-VE-338) from the gist exclusion constraint.
 */
export const createManualInterval = (
  mentor: string,
  request: ManualBookedIntervalRequest,
): Promise<MentorBookedIntervalResponse> =>
  apiClient
    .post<MentorBookedIntervalResponse>(`${BASE}/intervals`, request, { params: { mentor } })
    .then((r) => r.data)

/** POST /intervals/{id}/release — frees the range again. */
export const releaseBookedInterval = (
  mentor: string,
  intervalId: string,
): Promise<MentorBookedIntervalResponse> =>
  apiClient
    .post<MentorBookedIntervalResponse>(`${BASE}/intervals/${intervalId}/release`, null, {
      params: { mentor },
    })
    .then((r) => r.data)

/** GET /audit — calendar-mutation audit rows, newest first. */
export const listAvailabilityAudit = (
  mentor?: string,
  limit = 25,
): Promise<AvailabilityAuditResponse[]> =>
  apiClient
    .get<AvailabilityAuditResponse[]>(`${BASE}/audit`, {
      params: { ...(mentor ? { mentor } : {}), limit },
    })
    .then((r) => r.data)
