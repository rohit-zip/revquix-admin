/**
 * ─── JOIN MEETING BUTTON ──────────────────────────────────────────────────────
 *
 * Handles the Google Meet join flow with 30-minute window enforcement.
 *   1. Checks allowedJoinAt (from booking data) on the client
 *   2. Calls POST /api/v1/meetings/{sessionId}/join-event on click
 *   3. Backend records the join event and returns the Google Meet URL
 *   4. Opens the Google Meet URL directly in a new tab
 *
 * Props:
 *   sessionId       — MeetingSession ID
 *   allowedJoinAt   — ISO-8601 UTC instant
 *   meetingUrlPending — true if mentor hasn't set the link yet (manual mode)
 *   variant         — "default" | "icon"
 */

"use client"

import { useEffect, useState } from "react"
import { Clock, ExternalLink, LinkIcon, Loader2, Video } from "lucide-react"
import { toast } from "sonner"
import { getMeetingJoinUrl } from "@/features/book-slot/api/meeting.api"
import { ApiError } from "@/lib/api-error"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface JoinMeetingButtonProps {
  sessionId: string | null | undefined
  /** UTC instant string — meeting join window opens at this time */
  allowedJoinAt?: string | null
  /** True when the mentor hasn't set the meeting link yet (manual mode) */
  meetingUrlPending?: boolean
  /** "default" — text button with icon  |  "icon" — icon-only ghost button */
  variant?: "default" | "icon"
  className?: string
}

function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function JoinMeetingButton({
  sessionId,
  allowedJoinAt,
  meetingUrlPending = false,
  variant = "default",
  className,
}: JoinMeetingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isTooEarly, setIsTooEarly] = useState(false)

  // Re-check every 30 seconds so the button enables automatically when the window opens
  useEffect(() => {
    function checkWindow() {
      if (!allowedJoinAt) {
        setIsTooEarly(false)
        return
      }
      setIsTooEarly(Date.now() < new Date(allowedJoinAt).getTime())
    }
    checkWindow()
    const interval = setInterval(checkWindow, 30_000)
    return () => clearInterval(interval)
  }, [allowedJoinAt])

  if (!sessionId) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  // Meeting URL pending (mentor hasn't set it yet)
  if (meetingUrlPending) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={variant === "icon" ? "icon" : "sm"}
              className={cn(variant === "icon" ? "size-8" : "gap-2", "opacity-60 cursor-not-allowed", className)}
              disabled
            >
              {variant === "icon" ? (
                <LinkIcon className="size-4 text-muted-foreground" />
              ) : (
                <>
                  <LinkIcon className="size-4" />
                  Link Pending
                </>
              )}
              <span className="sr-only">Meeting link pending</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Waiting for the mentor to set the Google Meet link.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  async function handleJoin() {
    if (!sessionId || isTooEarly) return
    setLoading(true)
    try {
      const url = await getMeetingJoinUrl(sessionId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message)
        if (err.code === "RQ-DE-54") {
          setIsTooEarly(true)
        }
      } else if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("Could not join meeting. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const tooltipContent = isTooEarly && allowedJoinAt
    ? `Available to join at ${formatLocalTime(allowedJoinAt)}`
    : "Join Google Meet"

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", className)}
              onClick={handleJoin}
              disabled={loading || isTooEarly}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isTooEarly ? (
                <Clock className="size-4 text-muted-foreground" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              <span className="sr-only">Join meeting</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isTooEarly ? "outline" : "default"}
            size="sm"
            className={cn("gap-2", className)}
            onClick={handleJoin}
            disabled={loading || isTooEarly}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isTooEarly ? (
              <Clock className="size-4" />
            ) : (
              <Video className="size-4" />
            )}
            {isTooEarly && allowedJoinAt
              ? `Opens at ${formatLocalTime(allowedJoinAt)}`
              : "Join Meeting"}
          </Button>
        </TooltipTrigger>
        {isTooEarly && allowedJoinAt && (
          <TooltipContent>
            The meeting room opens 30 minutes before the scheduled start time.
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
