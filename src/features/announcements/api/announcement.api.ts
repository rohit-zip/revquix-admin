import { apiClient } from "@/lib/axios"
import type {
  AdminAnnouncement,
  AnnouncementInteractionRow,
  AnnouncementListParams,
  AnnouncementOverlap,
  AnnouncementPreview,
  AnnouncementStats,
  AnnouncementSurface,
  AnnouncementUpsertRequest,
  SpringPage,
} from "./announcement.types"

const ADMIN_ANNOUNCEMENTS = "/admin/announcements"

export const listAnnouncements = (
  params: AnnouncementListParams,
): Promise<SpringPage<AdminAnnouncement>> =>
  apiClient
    .get<SpringPage<AdminAnnouncement>>(ADMIN_ANNOUNCEMENTS, {
      params: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.surface ? { surface: params.surface } : {}),
        ...(params.scope ? { scope: params.scope } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    })
    .then((r) => r.data)

export const getAnnouncement = (announcementId: string): Promise<AdminAnnouncement> =>
  apiClient.get<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}`).then((r) => r.data)

/**
 * Which other published announcements share a window, and which one wins.
 *
 * This is what stands in for the "only one live bar" constraint the schema deliberately does not
 * have — many announcements may be live at once so that next week's can be scheduled while this
 * week's runs, and exactly one is ever served. The console's job is to say which.
 */
export const checkAnnouncementOverlap = (args: {
  announcementId?: string
  surface: AnnouncementSurface
  startsAt: string
  endsAt: string | null
}): Promise<AnnouncementOverlap> =>
  apiClient
    .get<AnnouncementOverlap>(`${ADMIN_ANNOUNCEMENTS}/overlap`, {
      params: {
        ...(args.announcementId ? { announcementId: args.announcementId } : {}),
        surface: args.surface,
        startsAt: args.startsAt,
        ...(args.endsAt ? { endsAt: args.endsAt } : {}),
      },
    })
    .then((r) => r.data)

export const createAnnouncement = (
  request: AnnouncementUpsertRequest,
): Promise<AdminAnnouncement> =>
  apiClient.post<AdminAnnouncement>(ADMIN_ANNOUNCEMENTS, request).then((r) => r.data)

export const updateAnnouncement = (
  announcementId: string,
  request: AnnouncementUpsertRequest,
): Promise<AdminAnnouncement> =>
  apiClient
    .put<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}`, request)
    .then((r) => r.data)

// ── Status transitions ───────────────────────────────────────────────────────
//
// Separate calls rather than a status field on the update payload. Editing copy and putting a
// message above the navbar of every page on the site are different acts: this shape lets the
// console confirm the second without nagging about the first, and it keeps the two apart in the
// admin audit trail.

export const publishAnnouncement = (announcementId: string): Promise<AdminAnnouncement> =>
  apiClient
    .post<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/publish`)
    .then((r) => r.data)

export const pauseAnnouncement = (
  announcementId: string,
  reason?: string,
): Promise<AdminAnnouncement> =>
  apiClient
    .post<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/pause`, null, {
      params: reason ? { reason } : undefined,
    })
    .then((r) => r.data)

export const resumeAnnouncement = (announcementId: string): Promise<AdminAnnouncement> =>
  apiClient
    .post<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/resume`)
    .then((r) => r.data)

export const archiveAnnouncement = (announcementId: string): Promise<AdminAnnouncement> =>
  apiClient
    .post<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/archive`)
    .then((r) => r.data)

export const deleteAnnouncement = (announcementId: string): Promise<void> =>
  apiClient.delete(`${ADMIN_ANNOUNCEMENTS}/${announcementId}`).then(() => undefined)

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — mentor banner moderation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Takes a mentor's banner off their profile.
 *
 * Deliberately not `pause`. A mentor holds pause/resume on their own banner; suppression is a
 * moderation decision they cannot undo by resuming — the only way out is to edit the banner, which
 * is the point. The two also produce different audit rows, so "a mentor paused their own banner"
 * stays distinguishable from "Revquix removed one".
 *
 * The reason is mandatory server-side and is shown to the mentor verbatim.
 */
export const suppressAnnouncement = (
  announcementId: string,
  reason: string,
): Promise<AdminAnnouncement> =>
  apiClient
    .post<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/suppress`, null, {
      params: { reason },
    })
    .then((r) => r.data)

export const unsuppressAnnouncement = (announcementId: string): Promise<AdminAnnouncement> =>
  apiClient
    .post<AdminAnnouncement>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/unsuppress`)
    .then((r) => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — the detail screen (§10.2) and preview-as-live (§10.3)
// ─────────────────────────────────────────────────────────────────────────────

export const getAnnouncementStats = (
  announcementId: string,
  days?: number,
): Promise<AnnouncementStats> =>
  apiClient
    .get<AnnouncementStats>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/stats`, {
      params: days ? { days } : undefined,
    })
    .then((r) => r.data)

export const listAnnouncementInteractions = (
  announcementId: string,
  page: number,
  size = 25,
): Promise<SpringPage<AnnouncementInteractionRow>> =>
  apiClient
    .get<SpringPage<AnnouncementInteractionRow>>(
      `${ADMIN_ANNOUNCEMENTS}/${announcementId}/interactions`,
      { params: { page, size } },
    )
    .then((r) => r.data)

/**
 * Mints a preview link. POST, not GET, because it writes an audit row.
 *
 * That row is the point: this is the one admin action that makes unpublished content reachable at
 * a public URL, and "who arranged that" is not answerable from anywhere else.
 */
export const mintAnnouncementPreview = (announcementId: string): Promise<AnnouncementPreview> =>
  apiClient
    .post<AnnouncementPreview>(`${ADMIN_ANNOUNCEMENTS}/${announcementId}/preview-token`)
    .then((r) => r.data)

/**
 * Downloads the interaction ledger as CSV and hands it to the browser.
 *
 * Fetched through `apiClient` rather than by pointing `window.location` at the URL, because the
 * endpoint needs the bearer token that only the axios interceptor attaches — a plain navigation
 * would arrive unauthenticated and render a 401 page.
 *
 * The object URL is revoked immediately after the click. Skipping that leaks the whole blob for the
 * life of the document, which for a large export is megabytes per download.
 *
 * The filename comes from the `Content-Disposition` the server sets, so an operator opening the file
 * months later can tell which announcement it belongs to; `fallbackFileName` covers the case where
 * a proxy strips the header.
 */
export const downloadAnnouncementInteractionsCsv = async (
  announcementId: string,
  fallbackFileName: string,
): Promise<void> => {
  const response = await apiClient.get<Blob>(
    `${ADMIN_ANNOUNCEMENTS}/${announcementId}/interactions.csv`,
    { responseType: "blob" },
  )

  const url = URL.createObjectURL(response.data)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileNameFromDisposition(response.headers) ?? fallbackFileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Pulls `filename="…"` out of a `Content-Disposition` header, if the server sent one. */
function fileNameFromDisposition(headers: unknown): string | null {
  const raw =
    typeof headers === "object" && headers !== null
      ? ((headers as Record<string, unknown>)["content-disposition"] as string | undefined)
      : undefined
  if (!raw) return null
  const match = /filename="?([^";]+)"?/i.exec(raw)
  return match?.[1] ?? null
}
