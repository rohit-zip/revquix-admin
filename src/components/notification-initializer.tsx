"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  useNotificationStream,
  useUnreadCount,
} from "@/features/notifications/api/notifications.hooks"
import { showNotificationToast } from "@/lib/show-toast"

// ─── NotificationStreamStarter ────────────────────────────────────────────────
// Inner component that is only mounted when the user is authenticated.
// Keeping hooks in a dedicated component (rather than calling them conditionally
// inside NotificationInitializer) satisfies the Rules of Hooks — every hook here
// runs unconditionally for the lifetime of this component.
function NotificationStreamStarter() {
  const router = useRouter()

  // Pre-fetch and keep the unread count fresh globally so the badge in
  // DashboardTopbar always reflects the correct number on first render.
  useUnreadCount()

  // Open a single, persistent SSE connection for the authenticated session.
  // This is intentionally at the provider level so the connection survives
  // navigation between pages, avoiding the cold-start penalty on every mount.
  useNotificationStream({
    onNotification: (event) =>
      showNotificationToast(event, (url) => router.push(url)),
  })

  return null
}

// ─── NotificationInitializer ──────────────────────────────────────────────────
// Always mounted in the provider tree. Renders NotificationStreamStarter only
// when the user is authenticated, ensuring notification APIs and SSE are never
// triggered for unauthenticated visitors (auth pages, maintenance page).
export default function NotificationInitializer() {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) return null

  return <NotificationStreamStarter />
}
