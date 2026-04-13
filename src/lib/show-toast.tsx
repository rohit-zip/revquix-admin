import { toast } from "sonner"
import type { ApiError, NetworkError } from "./api-error"

// ─── Success ──────────────────────────────────────────────────────────────────
export function showSuccessToast(message: string): void {
  toast.success(message)
}

// ─── Error ────────────────────────────────────────────────────────────────────
/**
 * Renders an ApiError or generic Error as a Sonner toast.
 *
 * Routing logic:
 *  - NetworkError          → single toast with connectivity message
 *  - ApiError (string)     → single toast with the message
 *  - ApiError (string[])   → toast with a bullet-list of messages
 *  - ApiError (field map)  → NOT handled here; use setError() on the form instead
 *  - Unknown Error         → generic fallback toast
 */
export function showErrorToast(error: ApiError | NetworkError | Error): void {
  if (error.name === "NetworkError") {
    toast.error(error.message)
    return
  }

  // ApiError — check message shape
  if (error.name === "ApiError") {
    const apiErr = error as ApiError

    // Field errors belong on the form — this function should not be called for them
    if (apiErr.isFieldError) return

    // List of messages → render bullet list inside toast
    if (apiErr.isListError) {
      const messages = apiErr.messages
      toast.error(
        <div>
          <p className="mb-1.5 font-semibold">Please fix the following:</p>
          <ul className="list-disc space-y-0.5 pl-4 text-sm">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>,
      )
      return
    }

    // Single string message
    toast.error(apiErr.messages[0] ?? "An unexpected error occurred.")
    return
  }

  // Unknown / untyped error — generic fallback
  toast.error("An unexpected error occurred. Please try again.")
}

