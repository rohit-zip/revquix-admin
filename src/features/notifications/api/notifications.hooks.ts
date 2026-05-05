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
  getStreamTicket,
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
      showErrorToast(error)
    },
  })
}

// ─── SSE Hook ─────────────────────────────────────────────────────────────────

interface UseNotificationStreamOptions {
  onNotification?: (event: SseNotificationEvent) => void
  onUnreadCountUpdate?: (count: number) => void
}

const SSE_BASE_RECONNECT_MS = 2_000
const SSE_MAX_RECONNECT_MS = 60_000
const SSE_BROADCAST_CHANNEL = "revquix:notifications"

type CrossTabMessage =
  | { kind: "notification"; payload: SseNotificationEvent }
  | { kind: "unread_count"; count: number }
  | { kind: "invalidate" }

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { accessToken, isLoggedIn } = useAuth()
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)

  const esRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const closedByUserRef = useRef(false)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const handleNotification = useCallback(
    (payload: SseNotificationEvent, broadcast: boolean) => {
      optionsRef.current.onNotification?.(payload)
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      if (broadcast && channelRef.current) {
        channelRef.current.postMessage({ kind: "notification", payload } satisfies CrossTabMessage)
      }
    },
    [queryClient],
  )

  const handleUnreadCount = useCallback(
    (count: number, broadcast: boolean) => {
      optionsRef.current.onUnreadCountUpdate?.(count)
      queryClient.setQueryData(notificationKeys.unreadCount, { count })
      if (broadcast && channelRef.current) {
        channelRef.current.postMessage({ kind: "unread_count", count } satisfies CrossTabMessage)
      }
    },
    [queryClient],
  )

  const closeCurrent = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (esRef.current) {
      try {
        esRef.current.close()
      } catch {
        /* noop */
      }
      esRef.current = null
    }
    setConnected(false)
  }, [])

  const scheduleReconnect = useCallback(
    (connectFn: () => void) => {
      if (closedByUserRef.current) return
      const attempt = retryCountRef.current
      retryCountRef.current = attempt + 1
      const exponential = SSE_BASE_RECONNECT_MS * Math.pow(2, attempt)
      const capped = Math.min(exponential, SSE_MAX_RECONNECT_MS)
      const jitter = Math.random() * Math.min(1_000, capped / 4)
      const delay = capped + jitter
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null
        connectFn()
      }, delay)
    },
    [],
  )

  const connect = useCallback(async () => {
    if (closedByUserRef.current) return
    if (!isLoggedIn || !accessToken) return

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (esRef.current) {
      try {
        esRef.current.close()
      } catch {
        /* noop */
      }
      esRef.current = null
    }

    let ticketResp
    try {
      ticketResp = await getStreamTicket()
    } catch (err) {
      const status = (err as { httpStatus?: number })?.httpStatus
      if (status === 401 || status === 403) {
        closedByUserRef.current = true
        return
      }
      scheduleReconnect(connect)
      return
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001/api/v1").replace(/\/$/, "")
    const apiOrigin = apiBase.replace(/\/api\/v1$/, "")
    const url = ticketResp.streamUrl.startsWith("http")
      ? ticketResp.streamUrl
      : `${apiOrigin}${ticketResp.streamUrl}`

    const es = new EventSource(url, { withCredentials: true })
    esRef.current = es

    es.addEventListener("open", () => {
      retryCountRef.current = 0
      setConnected(true)
    })

    es.addEventListener("connected", () => {
      retryCountRef.current = 0
      setConnected(true)
    })

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as SseNotificationEvent
        handleNotification(payload, true)
      } catch {
        /* malformed event */
      }
    })

    es.addEventListener("unread_count", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as SseUnreadCountEvent
        handleUnreadCount(payload.count, true)
      } catch {
        /* malformed event */
      }
    })

    es.addEventListener("reauth", () => {
      try { es.close() } catch { /* noop */ }
      esRef.current = null
      setConnected(false)
      retryCountRef.current = 0
      void connect()
    })

    es.addEventListener("shutdown", () => {
      try { es.close() } catch { /* noop */ }
      esRef.current = null
      setConnected(false)
      scheduleReconnect(connect)
    })

    es.addEventListener("error", () => {
      try { es.close() } catch { /* noop */ }
      esRef.current = null
      setConnected(false)
      scheduleReconnect(connect)
    })
  }, [accessToken, isLoggedIn, handleNotification, handleUnreadCount, scheduleReconnect])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (typeof BroadcastChannel === "undefined") return

    const channel = new BroadcastChannel(SSE_BROADCAST_CHANNEL)
    channelRef.current = channel
    channel.onmessage = (event: MessageEvent<CrossTabMessage>) => {
      const data = event.data
      if (!data || typeof data !== "object") return
      if (data.kind === "notification") {
        optionsRef.current.onNotification?.(data.payload)
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      } else if (data.kind === "unread_count") {
        optionsRef.current.onUnreadCountUpdate?.(data.count)
        queryClient.setQueryData(notificationKeys.unreadCount, { count: data.count })
      } else if (data.kind === "invalidate") {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      }
    }
    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [queryClient])

  useEffect(() => {
    closedByUserRef.current = false
    retryCountRef.current = 0
    void connect()
    return () => {
      closedByUserRef.current = true
      closeCurrent()
    }
  }, [connect, closeCurrent])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onOnline = () => {
      retryCountRef.current = 0
      void connect()
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible" && esRef.current === null && !closedByUserRef.current) {
        retryCountRef.current = 0
        void connect()
      }
    }
    window.addEventListener("online", onOnline)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("online", onOnline)
      document.removeEventListener("visibilitychange", onVisibility)
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
      showErrorToast(error)
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
      showErrorToast(error)
    },
  })
}
