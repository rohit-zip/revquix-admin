/**
 * ─── NOTIFICATIONS API ────────────────────────────────────────────────────────
 *
 * API calls for NotificationController endpoints.
 * All paths are relative to the apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  NotificationResponse,
  PageResponse,
  SendNotificationRequest,
  SseTicketResponse,
  UnreadCountResponse,
} from "./notifications.types"

const BASE = "/notifications"

// ─── User endpoints (inbox + unread count) ──────────────────────────────────────────

/** GET /notifications/unread-count — Current unread notification count */
export const getUnreadCount = (): Promise<UnreadCountResponse> =>
  apiClient
    .get<UnreadCountResponse>(`${BASE}/unread-count`)
    .then((r) => r.data)

/** GET /notifications?page=&size= — Paginated list of the current user’s notifications */
export const getMyNotifications = (
  page = 0,
  size = 20,
): Promise<PageResponse<NotificationResponse>> =>
  apiClient
    .get<PageResponse<NotificationResponse>>(BASE, { params: { page, size } })
    .then((r) => r.data)

/** POST /notifications/{id}/read — Mark a single notification as read */
export const markNotificationRead = (id: string): Promise<void> =>
  apiClient.post(`${BASE}/${id}/read`).then(() => undefined)

/** POST /notifications/read-all — Mark every notification as read */
export const markAllNotificationsRead = (): Promise<void> =>
  apiClient.post(`${BASE}/read-all`).then(() => undefined)

// ─── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * POST /notifications/admin/send — Send a notification.
 * targetUserId set → single user; targetRole set → role fan-out; neither → broadcast.
 */
export const adminSendNotification = (request: SendNotificationRequest): Promise<void> =>
  apiClient
    .post(`${BASE}/admin/send`, request)
    .then(() => undefined)

/** GET /notifications/admin/history — Paginated notification history */
export const adminGetHistory = (page = 0, size = 20): Promise<PageResponse<NotificationResponse>> =>
  apiClient
    .get<PageResponse<NotificationResponse>>(`${BASE}/admin/history`, { params: { page, size } })
    .then((r) => r.data)

/**
 * POST /notifications/admin/history/search — Filtered + paginated admin notification search.
 * Supports keyword search, field filters, range filters, and sorting via GenericFilterRequest.
 */
export const adminSearchNotifications = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<NotificationResponse>> =>
  apiClient
    .post<GenericFilterResponse<NotificationResponse>>(
      `${BASE}/admin/history/search`,
      request,
      { params: { page: params.page, size: params.size } },
    )
    .then((r) => r.data)

export const getStreamTicket = (): Promise<SseTicketResponse> =>
  apiClient
    .post<SseTicketResponse>(`${BASE}/stream/ticket`)
    .then((r) => r.data)
