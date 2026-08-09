"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"

import {
  archiveAnnouncement,
  checkAnnouncementOverlap,
  createAnnouncement,
  deleteAnnouncement,
  downloadAnnouncementInteractionsCsv,
  getAnnouncement,
  getAnnouncementStats,
  listAnnouncementInteractions,
  listAnnouncements,
  mintAnnouncementPreview,
  pauseAnnouncement,
  publishAnnouncement,
  resumeAnnouncement,
  suppressAnnouncement,
  unsuppressAnnouncement,
  updateAnnouncement,
} from "./announcement.api"
import type {
  AdminAnnouncement,
  AnnouncementListParams,
  AnnouncementPreview,
  AnnouncementSurface,
  AnnouncementUpsertRequest,
} from "./announcement.types"

export const announcementQueryKeys = {
  all: ["announcements"] as const,
  list: (params: AnnouncementListParams) =>
    ["announcements", "list", params.page, params.size, params.status, params.surface, params.scope] as const,
  detail: (announcementId: string) => ["announcements", "detail", announcementId] as const,
  overlap: (surface: string, startsAt: string, endsAt: string | null, selfId?: string) =>
    ["announcements", "overlap", surface, startsAt, endsAt, selfId ?? null] as const,
  stats: (announcementId: string, days: number) =>
    ["announcements", "stats", announcementId, days] as const,
  interactions: (announcementId: string, page: number) =>
    ["announcements", "interactions", announcementId, page] as const,
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function useAnnouncements(params: AnnouncementListParams) {
  return useQuery({
    queryKey: announcementQueryKeys.list(params),
    queryFn: () => listAnnouncements(params),
    placeholderData: keepPreviousData,
    // Short, because this list carries live engagement counters. A stale
    // click-through rate on the page an admin is using to judge a campaign is
    // worse than a refetch.
    staleTime: 10_000,
  })
}

export function useAnnouncement(announcementId: string) {
  return useQuery({
    queryKey: announcementQueryKeys.detail(announcementId),
    queryFn: () => getAnnouncement(announcementId),
    enabled: !!announcementId,
  })
}

/**
 * Live overlap check as the schedule fields change.
 *
 * Debounced by the caller rather than here — the editor holds the form state and knows when a
 * field settled. `enabled` guards the request until both a surface and a start time exist, so
 * typing into an empty form does not fire a query per keystroke.
 */
export function useAnnouncementOverlap(args: {
  announcementId?: string
  surface: AnnouncementSurface
  startsAt: string
  endsAt: string | null
  enabled: boolean
}) {
  return useQuery({
    queryKey: announcementQueryKeys.overlap(
      args.surface,
      args.startsAt,
      args.endsAt,
      args.announcementId,
    ),
    queryFn: () =>
      checkAnnouncementOverlap({
        announcementId: args.announcementId,
        surface: args.surface,
        startsAt: args.startsAt,
        endsAt: args.endsAt,
      }),
    enabled: args.enabled && !!args.startsAt,
    staleTime: 30_000,
  })
}

// ── Write ────────────────────────────────────────────────────────────────────

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation<AdminAnnouncement, ApiError | NetworkError, AnnouncementUpsertRequest>({
    mutationFn: (request) => createAnnouncement(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all })
      showSuccessToast("Announcement saved as a draft")
      queryClient.setQueryData(announcementQueryKeys.detail(data.announcementId), data)
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation<
    AdminAnnouncement,
    ApiError | NetworkError,
    { announcementId: string; request: AnnouncementUpsertRequest }
  >({
    mutationFn: ({ announcementId, request }) => updateAnnouncement(announcementId, request),
    onSuccess: (data) => {
      // Seed the detail cache from the response rather than invalidating it. The response carries
      // the new `version`, and the editor needs that immediately — a second save with the stale
      // version would 409 against the admin's own previous save.
      queryClient.setQueryData(announcementQueryKeys.detail(data.announcementId), data)
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all })
      showSuccessToast("Announcement updated")
    },
    onError: (err) => showErrorToast(err),
  })
}

function useStatusMutation(
  action: (announcementId: string) => Promise<AdminAnnouncement>,
  successMessage: (data: AdminAnnouncement) => string,
) {
  const queryClient = useQueryClient()
  return useMutation<AdminAnnouncement, ApiError | NetworkError, string>({
    mutationFn: action,
    onSuccess: (data) => {
      queryClient.setQueryData(announcementQueryKeys.detail(data.announcementId), data)
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all })
      showSuccessToast(successMessage(data))
    },
    onError: (err) => showErrorToast(err),
  })
}

export function usePublishAnnouncement() {
  return useStatusMutation(publishAnnouncement, (data) =>
    data.status === "SCHEDULED"
      ? "Scheduled. It will appear automatically at its start time."
      : "Published. It is live on the site within a minute.",
  )
}

export function usePauseAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation<
    AdminAnnouncement,
    ApiError | NetworkError,
    { announcementId: string; reason?: string }
  >({
    mutationFn: ({ announcementId, reason }) => pauseAnnouncement(announcementId, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(announcementQueryKeys.detail(data.announcementId), data)
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all })
      showSuccessToast("Paused. It comes off the site within a minute.")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useResumeAnnouncement() {
  return useStatusMutation(resumeAnnouncement, () => "Resumed")
}

export function useArchiveAnnouncement() {
  return useStatusMutation(archiveAnnouncement, () => "Archived")
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError | NetworkError, string>({
    mutationFn: (announcementId) => deleteAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all })
      showSuccessToast("Draft deleted")
    },
    onError: (err) => showErrorToast(err),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — the detail screen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The per-day series behind the sparkline.
 *
 * Cached for five minutes, far longer than the list's counters. The underlying table is written
 * once a night by the rollup job, so a shorter window would refetch a value that provably cannot
 * have changed — unlike the list, whose counters move with live traffic.
 */
export function useAnnouncementStats(announcementId: string, days: number) {
  return useQuery({
    queryKey: announcementQueryKeys.stats(announcementId, days),
    queryFn: () => getAnnouncementStats(announcementId, days),
    staleTime: 5 * 60_000,
    enabled: Boolean(announcementId),
  })
}

export function useAnnouncementInteractions(announcementId: string, page: number) {
  return useQuery({
    queryKey: announcementQueryKeys.interactions(announcementId, page),
    queryFn: () => listAnnouncementInteractions(announcementId, page),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: Boolean(announcementId),
  })
}

/**
 * Mints a preview link and opens it.
 *
 * The tab is opened in the mutation's `onSuccess` rather than by the caller, because a popup
 * blocker only lets `window.open` through when it can attribute the call to a user gesture — and by
 * the time an awaited promise resolves in a click handler, that attribution is gone in Safari.
 * Firing from the mutation callback keeps it inside the same task chain.
 */
export function useMintAnnouncementPreview() {
  return useMutation<AnnouncementPreview, ApiError | NetworkError, string>({
    mutationFn: (announcementId) => mintAnnouncementPreview(announcementId),
    onSuccess: (preview) => {
      window.open(preview.previewUrl, "_blank", "noopener,noreferrer")
      showSuccessToast("Preview opened. The link expires in a few minutes.")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useDownloadAnnouncementInteractionsCsv() {
  return useMutation<void, ApiError | NetworkError, { announcementId: string; fallbackFileName: string }>({
    mutationFn: ({ announcementId, fallbackFileName }) =>
      downloadAnnouncementInteractionsCsv(announcementId, fallbackFileName),
    onError: (err) => showErrorToast(err),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — mentor banner moderation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Takes a mentor's banner down.
 *
 * The success copy names the consequence rather than saying "done", because this action is visible
 * to somebody outside the console: the mentor sees the reason on their own dashboard.
 */
export function useSuppressAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation<
    AdminAnnouncement,
    ApiError | NetworkError,
    { announcementId: string; reason: string }
  >({
    mutationFn: ({ announcementId, reason }) => suppressAnnouncement(announcementId, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(announcementQueryKeys.detail(data.announcementId), data)
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all })
      showSuccessToast("Removed from the mentor's profile. They can see the reason you gave.")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useUnsuppressAnnouncement() {
  return useStatusMutation(unsuppressAnnouncement, () => "Takedown reversed")
}
