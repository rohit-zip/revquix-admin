import { toast } from "sonner"
import {
  Award,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  ShieldAlert,
  UserCheck,
  Video,
  Wallet,
} from "lucide-react"
import type { ApiError, NetworkError } from "./api-error"

// ─── Shared options ───────────────────────────────────────────────────────────

export interface ToastOptions {
  /** Secondary line rendered below the title */
  description?: string
  /** Inline call-to-action embedded in the toast */
  action?: { label: string; onClick: () => void }
  /** Custom duration in ms. Each variant has its own sensible default. */
  duration?: number
  /**
   * Deduplication key — Sonner replaces an existing toast that has the same id
   * rather than stacking a new one. Useful for network errors & rapid retries.
   */
  id?: string
}

// ─── Error throttle ───────────────────────────────────────────────────────────
// Prevents a flood of simultaneous API failures from stacking many toasts.
// Limit: 3 distinct error toasts per 3-second window. Extras are dropped silently.

const ERROR_WINDOW_MS = 3_000
const MAX_ERRORS_PER_WINDOW = 3
const recentErrorTs: number[] = []

function isErrorThrottled(): boolean {
  const now = Date.now()
  while (recentErrorTs.length > 0 && recentErrorTs[0] < now - ERROR_WINDOW_MS) {
    recentErrorTs.shift()
  }
  if (recentErrorTs.length >= MAX_ERRORS_PER_WINDOW) return true
  recentErrorTs.push(now)
  return false
}

// ─── Copy-to-clipboard helper ─────────────────────────────────────────────────

function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string): void {
  try {
    const el = document.createElement("textarea")
    el.value = text
    el.style.position = "fixed"
    el.style.opacity = "0"
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
  } catch {
    // Clipboard not available in this context — silently fail
  }
}

// ─── Success (4 s) ────────────────────────────────────────────────────────────

export function showSuccessToast(title: string, options?: ToastOptions): void {
  toast.success(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 4000,
    id: options?.id,
  })
}

// ─── Warning (6 s) ────────────────────────────────────────────────────────────

export function showWarningToast(title: string, options?: ToastOptions): void {
  toast.warning(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 6000,
    id: options?.id,
  })
}

// ─── Info (5 s) ───────────────────────────────────────────────────────────────

export function showInfoToast(title: string, options?: ToastOptions): void {
  toast.info(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? 5000,
    id: options?.id,
  })
}

// ─── Loading (persistent until dismissed) ────────────────────────────────────
/**
 * Shows a persistent loading toast. Returns the id so the caller can dismiss it
 * once the async operation completes:
 *
 *   const id = showLoadingToast("Sending notification…", "send-notification")
 *   await sendNotification(data)
 *   toast.dismiss(id)
 *   showSuccessToast("Notification sent")
 */
export function showLoadingToast(
  title: string,
  id: string,
  options?: Pick<ToastOptions, "description">,
): string {
  toast.loading(title, {
    description: options?.description,
    id,
    duration: Infinity,
  })
  return id
}

// ─── Promise (loading → success / error lifecycle) ────────────────────────────

export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: unknown) => string)
    description?: string
  },
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    description: messages.description,
  })
  return promise
}

// ─── Error (7 s) — with rate-limiting + auto copy-ID ─────────────────────────
/**
 * Renders an ApiError, NetworkError, or plain Error as a Sonner toast.
 *
 * Routing logic:
 *  - NetworkError          → "Connection Issue" title + message (deduped, throttled)
 *  - ApiError (string)     → single-line toast (deduped by message, auto copy-ID on 5xx)
 *  - ApiError (string[])   → "Please fix the following" + bullet-list description
 *  - ApiError (field map)  → NOT handled here; use setError() on the form instead
 *  - Plain Error           → error.message as title (deduped by message)
 *  - Unknown               → generic fallback toast
 */
export function showErrorToast(
  error: ApiError | NetworkError | Error,
  options?: ToastOptions,
): void {
  // NetworkErrors bypass throttling — connectivity issues must always surface
  if (error.name === "NetworkError") {
    toast.error("Connection Issue", {
      description: error.message,
      id: options?.id ?? "network-error",
      duration: options?.duration ?? 7000,
      action: options?.action,
    })
    return
  }

  // All other errors are subject to the rate-limit
  if (isErrorThrottled()) return

  // ── Structured API error ──────────────────────────────────────────────────
  if (error.name === "ApiError") {
    const apiErr = error as ApiError

    // Field-level errors belong on the form — this helper must not be called for them
    if (apiErr.isFieldError) return

    // Copy-ID is only useful for 5xx server errors
    const isServerError = apiErr.is5xx && apiErr.requestId && apiErr.requestId !== "unknown"
    const copyAction = isServerError
      ? { label: "Copy ID", onClick: () => copyToClipboard(apiErr.requestId) }
      : undefined
    const resolvedAction = options?.action ?? copyAction

    // List of validation messages → render as bullet list in the description
    if (apiErr.isListError) {
      const messages = apiErr.messages
      toast.error("Please fix the following", {
        id: options?.id ?? `api-list-${messages[0]}`,
        description: (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12.5px]">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        ),
        duration: options?.duration ?? 8000,
        action: resolvedAction,
      })
      return
    }

    // Single message — dedupe by message text so rapid retries don't stack
    const message = apiErr.messages[0] ?? "An unexpected error occurred."
    toast.error(message, {
      description: options?.description ?? (isServerError ? `Error ID: ${apiErr.requestId}` : undefined),
      id: options?.id ?? `api-${message}`,
      duration: options?.duration ?? 7000,
      action: resolvedAction,
    })
    return
  }

  // ── Plain Error ───────────────────────────────────────────────────────────
  const plainMessage = (error as Error).message?.trim()
  if (plainMessage) {
    toast.error(plainMessage, {
      description: options?.description,
      id: options?.id ?? `error-${plainMessage}`,
      duration: options?.duration ?? 7000,
      action: options?.action,
    })
    return
  }

  // ── Unknown / untyped error ───────────────────────────────────────────────
  toast.error("Something went wrong", {
    description: "An unexpected error occurred. Please try again.",
    id: options?.id ?? "generic-error",
    duration: options?.duration ?? 7000,
  })
}

// ─── Notification toast ───────────────────────────────────────────────────────
/**
 * Renders a real-time SSE notification as a styled toast.
 * Called from `useNotificationStream`'s `onNotification` callback.
 * Uses category-specific Lucide icons for visual scannability.
 * Deduplication is keyed on `notificationId` to prevent duplicates.
 */

export interface NotificationToastPayload {
  notificationId: string
  title: string
  message: string | null
  category: string
  actionButtons?: Array<{ label: string; url: string }> | null
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  BOOKINGS:           <Calendar    className="size-4 text-primary" />,
  PAYMENTS:           <CreditCard  className="size-4 text-emerald-500" />,
  MOCK_INTERVIEWS:    <Video       className="size-4 text-blue-500" />,
  HOURLY_SESSIONS:    <Clock       className="size-4 text-sky-500" />,
  DISPUTES:           <ShieldAlert className="size-4 text-destructive" />,
  MENTOR_APPLICATION: <UserCheck   className="size-4 text-primary" />,
  MENTOR_EARNINGS:    <Wallet      className="size-4 text-emerald-500" />,
  MENTOR_STATUS:      <Award       className="size-4 text-amber-500" />,
  PLATFORM:           <Bell        className="size-4 text-muted-foreground" />,
}

export function showNotificationToast(
  payload: NotificationToastPayload,
  onAction?: (url: string) => void,
): void {
  const icon = CATEGORY_ICON[payload.category] ?? <Bell className="size-4 text-muted-foreground" />
  const primaryAction = payload.actionButtons?.[0]
  toast(payload.title, {
    description: payload.message ?? undefined,
    icon,
    id: payload.notificationId,
    duration: 6000,
    action: primaryAction
      ? {
          label: primaryAction.label,
          onClick: () => {
            if (onAction) {
              onAction(primaryAction.url)
            } else if (/^https?:\/\//.test(primaryAction.url)) {
              window.open(primaryAction.url, "_blank", "noopener,noreferrer")
            } else {
              window.location.href = primaryAction.url
            }
          },
        }
      : undefined,
  })
}

