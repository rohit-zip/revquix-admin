"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Query } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  cancelLeadMailCampaign,
  cloneLeadMailCampaign,
  countLeadMailAllUsersEligible,
  createLeadMailDraft,
  deleteLeadMailDraft,
  downloadLeadMailCampaignRecipientsCsv,
  downloadLeadMailRecipientTemplate,
  annotateLeadMailRecipients,
  getLeadMailCampaign,
  listLeadMailCampaignRecipients,
  listLeadMailCampaigns,
  listLeadMailContentPosts,
  parseLeadMailExcel,
  parseLeadMailRecipients,
  pauseLeadMailCampaign,
  previewLeadMail,
  resumeLeadMailCampaign,
  retryFailedLeadMailRecipients,
  searchLeadMailAudienceUsers,
  searchLeadMailRecipients,
  sendLeadMail,
  sendLeadMailDraft,
  testSendLeadMail,
  testSmtpConnection,
  updateLeadMailDraft,
} from "./lead-mail.api"
import type {
  LeadMailBlogKind,
  LeadMailCampaignActionRequest,
  LeadMailCampaignListFilters,
  LeadMailCampaignSummaryResponse,
  LeadMailContentCandidate,
  LeadMailDeliveryStatus,
  LeadMailDraftRequest,
  LeadMailDraftSendRequest,
  LeadMailPage,
  LeadMailPreviewRequest,
  LeadMailSendRequest,
  LeadMailTestSendRequest,
  SmtpTestConnectionRequest,
} from "./lead-mail.types"

export const leadMailKeys = {
  all: ["lead-mail"] as const,
  // Filters are part of the key, so each filter combination caches independently rather than
  // overwriting the previous result under one shared key.
  campaignList: (page: number, size: number, filters: LeadMailCampaignListFilters = {}) =>
    ["lead-mail", "campaigns", "list", page, size, filters] as const,
  campaignDetail: (id: string) => ["lead-mail", "campaigns", "detail", id] as const,
  campaignRecipients: (
    id: string,
    page: number,
    size: number,
    deliveryStatus?: LeadMailDeliveryStatus,
    q?: string,
  ) => ["lead-mail", "campaigns", "recipients", id, page, size, deliveryStatus ?? null, q ?? null] as const,
  recipientSearch: (q: string) => ["lead-mail", "search-recipients", q] as const,
  // Audience builder (Phase 3)
  audienceUsers: (
    page: number,
    size: number,
    q?: string,
    emailVerified?: boolean,
    joinedFrom?: string,
    joinedTo?: string,
  ) =>
    [
      "lead-mail",
      "audience",
      "users",
      page,
      size,
      q ?? null,
      emailVerified ?? null,
      joinedFrom ?? null,
      joinedTo ?? null,
    ] as const,
  allUsersCount: () => ["lead-mail", "audience", "all-users-count"] as const,
  // Content picker (Phase 6)
  contentPosts: (page: number, size: number, kind?: string, q?: string) =>
    ["lead-mail", "content", "posts", page, size, kind ?? null, q ?? null] as const,
}

/** Manual recipient-entry autocomplete — debounced by the caller before enabling. */
export function useLeadMailRecipientSearch(query: string) {
  return useQuery({
    queryKey: leadMailKeys.recipientSearch(query),
    queryFn: () => searchLeadMailRecipients(query),
    enabled: query.trim().length >= 2,
  })
}

export function useParseLeadMailExcel() {
  return useMutation<Awaited<ReturnType<typeof parseLeadMailExcel>>, ApiError | NetworkError, File>({
    mutationFn: (file) => parseLeadMailExcel(file),
    onError: (err) => showErrorToast(err),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Audience builder (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

/** Supersedes useParseLeadMailExcel for the review table: xlsx AND csv, with per-row detail. */
export function useParseLeadMailRecipients() {
  return useMutation<Awaited<ReturnType<typeof parseLeadMailRecipients>>, ApiError | NetworkError, File>({
    mutationFn: (file) => parseLeadMailRecipients(file),
    onError: (err) => showErrorToast(err),
  })
}

export function useDownloadLeadMailRecipientTemplate() {
  return useMutation<void, ApiError | NetworkError, void>({
    mutationFn: () => downloadLeadMailRecipientTemplate(),
    onError: (err) => showErrorToast(err),
  })
}

/**
 * Annotates email addresses with Revquix-user and suppression status (requirement 11).
 *
 * A mutation rather than a query: the caller decides when and in what batches to annotate (the
 * review table chunks a large list into batches of 500), and the result is merged into local
 * table state rather than cached under a query key keyed on the whole list.
 */
export function useAnnotateLeadMailRecipients() {
  return useMutation<Awaited<ReturnType<typeof annotateLeadMailRecipients>>, ApiError | NetworkError, string[]>({
    mutationFn: (emails) => annotateLeadMailRecipients(emails),
    onError: (err) => showErrorToast(err),
  })
}

/** Paginated Revquix-user search behind the "Search users" audience tab (requirement 4). */
export function useLeadMailAudienceUsers(
  page: number,
  size: number,
  filters: { q?: string; emailVerified?: boolean; joinedFrom?: string; joinedTo?: string } = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: leadMailKeys.audienceUsers(
      page,
      size,
      filters.q,
      filters.emailVerified,
      filters.joinedFrom,
      filters.joinedTo,
    ),
    queryFn: () =>
      searchLeadMailAudienceUsers(page, size, filters.q, filters.emailVerified, filters.joinedFrom, filters.joinedTo),
    enabled: options?.enabled ?? true,
    placeholderData: (previous) => previous,
  })
}

/**
 * Dry-run eligible-recipient count for the ALL_USERS audience (requirement 5).
 *
 * `enabled` should be gated on the caller actually holding PERM_SEND_LEAD_MAIL_ALL_USERS and
 * having selected the ALL_USERS audience tab — this hook does not itself check the permission,
 * since the frontend cannot enforce it and the backend 403s regardless.
 */
export function useLeadMailAllUsersCount(options?: { enabled?: boolean }) {
  return useQuery<Awaited<ReturnType<typeof countLeadMailAllUsersEligible>>, ApiError | NetworkError>({
    queryKey: leadMailKeys.allUsersCount(),
    queryFn: () => countLeadMailAllUsersEligible(),
    enabled: options?.enabled ?? false,
  })
}

/**
 * Posts attachable to a campaign (Phase 6).
 *
 * `enabled` is caller-controlled so the picker only queries while its dialog is open — a list of
 * published posts is not something the compose screen needs to fetch on mount for the majority of
 * campaigns that attach nothing.
 */
export function useLeadMailContentPosts(
  page: number,
  size: number,
  kind?: LeadMailBlogKind,
  q?: string,
  options?: { enabled?: boolean },
) {
  return useQuery<LeadMailPage<LeadMailContentCandidate>, ApiError | NetworkError>({
    queryKey: leadMailKeys.contentPosts(page, size, kind, q),
    queryFn: () => listLeadMailContentPosts(page, size, kind, q),
    enabled: options?.enabled ?? true,
    // The picker is re-opened repeatedly while composing one campaign, and the set of published
    // posts does not change between those opens.
    staleTime: 60_000,
  })
}

export function usePreviewLeadMail() {
  return useMutation<
    Awaited<ReturnType<typeof previewLeadMail>>,
    ApiError | NetworkError,
    LeadMailPreviewRequest
  >({
    mutationFn: (request) => previewLeadMail(request),
    onError: (err) => showErrorToast(err),
  })
}

/**
 * Tests an ad-hoc SMTP configuration (Phase 2, Option A). Does not throw on a
 * connection/auth failure — the backend always returns {success:false, message}
 * rather than an HTTP error, so the caller reads `data.success` / `data.message`
 * directly rather than relying on onError.
 */
export function useTestSmtpConnection() {
  return useMutation<
    Awaited<ReturnType<typeof testSmtpConnection>>,
    ApiError | NetworkError,
    SmtpTestConnectionRequest
  >({
    mutationFn: (request) => testSmtpConnection(request),
    onError: (err) => showErrorToast(err),
  })
}

export function useTestSendLeadMail() {
  return useMutation<void, ApiError | NetworkError, LeadMailTestSendRequest>({
    mutationFn: (request) => testSendLeadMail(request),
    onSuccess: () => showSuccessToast("Test email sent"),
    onError: (err) => showErrorToast(err),
  })
}

export function useSendLeadMail() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof sendLeadMail>>,
    ApiError | NetworkError,
    LeadMailSendRequest
  >({
    mutationFn: (request) => sendLeadMail(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast(`Campaign sent to ${data.recipientCount} recipient(s)`)
    },
    onError: (err) => showErrorToast(err),
  })
}

/**
 * Campaign detail + send report.
 *
 * `refetchInterval` accepts TanStack Query's function form as well as a plain number. The
 * function form is what lets a caller stop polling at a terminal status — Query re-evaluates it
 * after every fetch and treats a `false` return as "stop". A number-only signature forced
 * callers into a constant interval, which is how the detail view ended up polling finished
 * campaigns forever (plan §0.4 defect 2).
 */
export function useLeadMailCampaign(
  campaignId: string,
  options?: {
    refetchInterval?:
      | number
      | false
      | ((query: Query<LeadMailCampaignSummaryResponse, ApiError | NetworkError>) => number | false)
  },
) {
  return useQuery<LeadMailCampaignSummaryResponse, ApiError | NetworkError>({
    queryKey: leadMailKeys.campaignDetail(campaignId),
    queryFn: () => getLeadMailCampaign(campaignId),
    enabled: !!campaignId,
    refetchInterval: options?.refetchInterval,
  })
}

export function useLeadMailCampaignList(
  page: number,
  size: number,
  filters: LeadMailCampaignListFilters = {},
) {
  return useQuery({
    queryKey: leadMailKeys.campaignList(page, size, filters),
    queryFn: () => listLeadMailCampaigns(page, size, filters),
    // Keeps the previous page rendered while the next one loads, so paging and filtering do not
    // blank the table on every keystroke.
    placeholderData: (previous) => previous,
  })
}

/** One page of a campaign's send report. */
export function useLeadMailCampaignRecipients(
  campaignId: string,
  page: number,
  size: number,
  deliveryStatus?: LeadMailDeliveryStatus,
  q?: string,
) {
  return useQuery({
    queryKey: leadMailKeys.campaignRecipients(campaignId, page, size, deliveryStatus, q),
    queryFn: () => listLeadMailCampaignRecipients(campaignId, page, size, deliveryStatus, q),
    enabled: !!campaignId,
    placeholderData: (previous) => previous,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Drafts
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateLeadMailDraft() {
  const queryClient = useQueryClient()
  return useMutation<LeadMailCampaignSummaryResponse, ApiError | NetworkError, LeadMailDraftRequest>({
    mutationFn: (request) => createLeadMailDraft(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast("Draft saved")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUpdateLeadMailDraft() {
  const queryClient = useQueryClient()
  return useMutation<
    LeadMailCampaignSummaryResponse,
    ApiError | NetworkError,
    { campaignId: string; request: LeadMailDraftRequest }
  >({
    mutationFn: ({ campaignId, request }) => updateLeadMailDraft(campaignId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast("Draft updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDeleteLeadMailDraft() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: (campaignId) => deleteLeadMailDraft(campaignId),
    onSuccess: (_data, campaignId) => {
      // Remove rather than invalidate: the campaign no longer exists, so a refetch of its detail
      // key would 404 for any component still mounted against it.
      queryClient.removeQueries({ queryKey: leadMailKeys.campaignDetail(campaignId) })
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      showSuccessToast("Draft deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useCloneLeadMailCampaign() {
  const queryClient = useQueryClient()
  return useMutation<LeadMailCampaignSummaryResponse, ApiError | NetworkError, string>({
    mutationFn: (campaignId) => cloneLeadMailCampaign(campaignId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast("Campaign copied to a new draft")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useSendLeadMailDraft() {
  const queryClient = useQueryClient()
  return useMutation<
    LeadMailCampaignSummaryResponse,
    ApiError | NetworkError,
    { campaignId: string; request: LeadMailDraftSendRequest }
  >({
    mutationFn: ({ campaignId, request }) => sendLeadMailDraft(campaignId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast(`Campaign sending to ${data.recipientCount} recipient(s)`)
    },
    onError: (err) => showErrorToast(err),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One hook for all four lifecycle actions.
 *
 * They share an identical signature, response and cache-update rule, so four near-identical hooks
 * would differ only in which function they call. The caller passes the action.
 */
export function useLeadMailCampaignAction() {
  const queryClient = useQueryClient()
  return useMutation<
    LeadMailCampaignSummaryResponse,
    ApiError | NetworkError,
    {
      campaignId: string
      action: "pause" | "resume" | "cancel" | "retry-failed"
      request?: LeadMailCampaignActionRequest
    }
  >({
    mutationFn: ({ campaignId, action, request }) => {
      switch (action) {
        case "pause":
          return pauseLeadMailCampaign(campaignId)
        case "resume":
          return resumeLeadMailCampaign(campaignId, request)
        case "cancel":
          return cancelLeadMailCampaign(campaignId, request)
        case "retry-failed":
          return retryFailedLeadMailRecipients(campaignId, request)
      }
    },
    onSuccess: (data, { action }) => {
      queryClient.invalidateQueries({ queryKey: leadMailKeys.all })
      queryClient.setQueryData(leadMailKeys.campaignDetail(data.leadMailCampaignId), data)
      showSuccessToast(ACTION_TOASTS[action])
    },
    onError: (err) => showErrorToast(err),
  })
}

const ACTION_TOASTS: Record<"pause" | "resume" | "cancel" | "retry-failed", string> = {
  pause: "Campaign paused",
  resume: "Campaign resumed",
  cancel: "Campaign cancelled",
  "retry-failed": "Retrying failed recipients",
}

/**
 * Downloads the send report as CSV.
 *
 * A mutation rather than a query: it is an imperative action with a side effect on the document, and
 * caching a multi-megabyte blob under a query key is exactly what should not happen.
 */
export function useDownloadLeadMailRecipientsCsv() {
  return useMutation<void, ApiError | NetworkError, { campaignId: string; fallbackFileName: string }>({
    mutationFn: ({ campaignId, fallbackFileName }) =>
      downloadLeadMailCampaignRecipientsCsv(campaignId, fallbackFileName),
    onError: (err) => showErrorToast(err),
  })
}
