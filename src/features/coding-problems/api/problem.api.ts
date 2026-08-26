/**
 * ─── CODING PROBLEM API (admin console) ──────────────────────────────────────
 *
 * The review half of the problem lifecycle — `AdminProblemController`. Paths are relative to the
 * apiClient baseURL (/api/v1).
 *
 * Authoring endpoints (`/authoring/problems/**`) deliberately do NOT live here. Problems are
 * written in revquix-web on the Blog editor; this console reviews them, it does not write them.
 * The one exception is the Approach, which a publisher may write for any problem — and that lives
 * on the authoring controller, so it is called out explicitly below rather than smuggled in.
 */

import { apiClient } from "@/lib/axios"
import type {
  PagedResponse,
  ProblemDetail,
  ProblemStatus,
  ProblemSummary,
  ReviewDecisionRequest,
} from "./problem.types"

const BASE = "/admin/problems"

/** GET /admin/problems — problems by status. IN_REVIEW comes back oldest first. */
export const listProblems = (params: {
  status: ProblemStatus
  page: number
  size: number
}): Promise<PagedResponse<ProblemSummary>> =>
  apiClient.get<PagedResponse<ProblemSummary>>(BASE, { params }).then((r) => r.data)

/** GET /admin/problems/queue-size — how many are waiting. */
export const getQueueSize = (): Promise<{ inReview: number }> =>
  apiClient.get<{ inReview: number }>(`${BASE}/queue-size`).then((r) => r.data)

/** GET /admin/problems/{id} — the problem in full, with its solutions and gate report. */
export const getProblem = (problemId: string): Promise<ProblemDetail> =>
  apiClient.get<ProblemDetail>(`${BASE}/${problemId}`).then((r) => r.data)

/** POST /admin/problems/{id}/approve — approve and publish, claiming its number. */
export const approveProblem = (
  problemId: string,
  data?: ReviewDecisionRequest,
): Promise<ProblemDetail> =>
  apiClient.post<ProblemDetail>(`${BASE}/${problemId}/approve`, data ?? {}).then((r) => r.data)

/** POST /admin/problems/{id}/request-changes — send it back. ⚠ The note is required. */
export const requestProblemChanges = (
  problemId: string,
  data: ReviewDecisionRequest,
): Promise<ProblemDetail> =>
  apiClient.post<ProblemDetail>(`${BASE}/${problemId}/request-changes`, data).then((r) => r.data)

/** POST /admin/problems/{id}/publish — publish without human review. Still needs a passing gate. */
export const publishProblem = (problemId: string): Promise<ProblemDetail> =>
  apiClient.post<ProblemDetail>(`${BASE}/${problemId}/publish`).then((r) => r.data)

/** POST /admin/problems/{id}/unlist — keep the URL alive, drop it from every list. */
export const unlistProblem = (
  problemId: string,
  data?: ReviewDecisionRequest,
): Promise<ProblemDetail> =>
  apiClient.post<ProblemDetail>(`${BASE}/${problemId}/unlist`, data ?? {}).then((r) => r.data)

/** POST /admin/problems/{id}/retire — withdraw it. Solvers keep their record. */
export const retireProblem = (
  problemId: string,
  data?: ReviewDecisionRequest,
): Promise<ProblemDetail> =>
  apiClient.post<ProblemDetail>(`${BASE}/${problemId}/retire`, data ?? {}).then((r) => r.data)

/** POST /admin/problems/{id}/republish — bring it back, keeping its number. */
export const republishProblem = (problemId: string): Promise<ProblemDetail> =>
  apiClient.post<ProblemDetail>(`${BASE}/${problemId}/republish`).then((r) => r.data)

/**
 * PUT /authoring/problems/{id}/approach — write the Approach.
 *
 * ⚠ On the AUTHORING controller, not the admin one, and that is deliberate on the backend: a
 * publisher may write the Approach for any problem, and an author may write it for their own, so
 * it is one endpoint with one rule rather than two that could diverge.
 */
export const saveApproach = (
  problemId: string,
  data: { bodyHtml: string; published: boolean },
): Promise<void> =>
  apiClient.put(`/authoring/problems/${problemId}/approach`, data).then(() => undefined)
