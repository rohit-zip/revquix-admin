/**
 * ─── NOTIFICATION HOOKS ───────────────────────────────────────────────────────
 *
 * React Query + SSE hooks for the notification system (admin).
 */

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError } from "@/lib/api-error"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import {
  adminGetHistory,
  adminSearchNotifications,
  adminSendNotification,
  getUnreadCount,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications.api"
import type {
  NotificationResponse,
  PageResponse,
  SendNotificationRequest,
  SseNotificationEvent,
  SseUnreadCountEvent,
} from "./notifications.types"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ["notifications"] as const,
  history: (page: number, size: number) => ["notifications", "admin-history", page, size] as const,
  myNotifications: (page: number, size: number) => ["notifications", "my-inbox", page, size] as const,
  unreadCount: ["notifications", "unread-count"] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminNotificationHistory(page = 0, size = 20) {
  return useQuery<PageResponse<NotificationResponse>>({
    queryKey: notificationKeys.history(page, size),
    queryFn: () => adminGetHistory(page, size),
  })
}

// ─── Filter config for admin notification search ──────────────────────────────

const NOTIFICATION_FILTER_CONFIG: FilterConfig = {
  entityLabel: "Notifications",
  searchableFields: ["title", "message"],
  filterFields: [
    {
      field: "category",
      label: "Category",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Bookings & Sessions", value: "BOOKINGS" },
        { label: "Payments & Refunds", value: "PAYMENTS" },
        { label: "Resume Reviews", value: "RESUME_REVIEW" },
        { label: "Mock Interviews", value: "MOCK_INTERVIEWS" },
        { label: "Hourly Sessions", value: "HOURLY_SESSIONS" },
        { label: "Disputes", value: "DISPUTES" },
        { label: "Mentor Application", value: "MENTOR_APPLICATION" },
        { label: "Mentor Earnings", value: "MENTOR_EARNINGS" },
        { label: "Mentor Status", value: "MENTOR_STATUS" },
        { label: "Platform", value: "PLATFORM" },
      ],
    },
    {
      field: "read",
      label: "Status",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Unread", value: false },
        { label: "Read", value: true },
      ],
    },
    {
      field: "email",
      label: "Email sent",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    {
      field: "targetUserId",
      label: "User ID",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Sent Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Sent Date" },
    { field: "category", label: "Category" },
    { field: "type", label: "Type" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

export function useAdminNotificationSearch() {
  return useGenericSearch<NotificationResponse>({
    queryKey: "admin-notification-history-search",
    searchFn: adminSearchNotifications,
    config: NOTIFICATION_FILTER_CONFIG,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    select: (data) => data.count,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAdminSendNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: SendNotificationRequest) => adminSendNotification(request),
    onSuccess: () => {
      showSuccessToast("Notification sent successfully")
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: (error: ApiError) => {
      showErrorToast(error?.response?.data?.message || "Failed to send notification")
    },
  })
}

// ─── SSE Hook ─────────────────────────────────────────────────────────────────

interface UseNotificationStreamOptions {
  onNotification?: (event: SseNotificationEvent) => void
  onUnreadCountUpdate?: (count: number) => void
}

/**
 * Establishes an SSE connection for real-time notifications.
 * Used in the admin topbar to receive live unread count updates.
 */
const SSE_MAX_RETRIES = 5

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const optionsRef = useRef(options)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  optionsRef.current = options

  const connect = useCallback(() => {
    if (!accessToken) return

    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    esRef.current?.close()

    const apiBase =
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001/api/v1")
        .replace(/\/$/, "")

    const url = `${apiBase}/notifications/stream?token=${encodeURIComponent(accessToken)}`
    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener("open", () => {
      setConnected(true)
      retryCountRef.current = 0
    })

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const payload: SseNotificationEvent = JSON.parse(e.data)
        optionsRef.current.onNotification?.(payload)
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      } catch {
        // Ignore malformed events
      }
    })

    es.addEventListener("unread_count", (e: MessageEvent) => {
      try {
        const payload: SseUnreadCountEvent = JSON.parse(e.data)
        optionsRef.current.onUnreadCountUpdate?.(payload.count)
        queryClient.setQueryData(notificationKeys.unreadCount, { count: payload.count })
      } catch {
        // Ignore malformed events
      }
    })

    es.addEventListener("error", () => {
      setConnected(false)
      // Prevent browser auto-reconnect with the same (possibly expired) URL token
      es.close()
      esRef.current = null

      if (retryCountRef.current >= SSE_MAX_RETRIES) {
        // Give up — SSE will resume automatically on the next token refresh
        return
      }

      // Exponential back-off: 1 s, 2 s, 4 s, 8 s, 16 s
      const delay = Math.min(1_000 * Math.pow(2, retryCountRef.current), 30_000)
      retryCountRef.current += 1
      reconnectTimerRef.current = setTimeout(() => connect(), delay)
    })
  }, [accessToken, queryClient])

  // A fresh token means a clean slate — reset retry counter so the new connection
  // gets the full 5 attempts before giving up.
  useEffect(() => {
    retryCountRef.current = 0
  }, [accessToken])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      esRef.current?.close()
      esRef.current = null
      setConnected(false)
    }
  }, [connect])

  return { connected }
}

// ─── Inbox Hooks (admin's own notifications) ──────────────────────────────────

export function useMyNotifications(page = 0, size = 20) {
  return useQuery<PageResponse<NotificationResponse>>({
    queryKey: notificationKeys.myNotifications(page, size),
    queryFn: () => getMyNotifications(page, size),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: (error: ApiError) => {
      showErrorToast(error?.response?.data?.message || "Failed to mark as read")
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      showSuccessToast("All notifications marked as read")
    },
    onError: (error: ApiError) => {
      showErrorToast(error?.response?.data?.message || "Failed to mark all as read")
    },
  })
}
