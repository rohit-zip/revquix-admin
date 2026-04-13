"use client"

import { CheckCircle2, Clock, LinkIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MeetingLinkStatusProps {
  meetingProvider?: "GOOGLE_MEET" | "MANUAL_GOOGLE_MEET" | null
  meetingUrlPending?: boolean
  className?: string
}

/**
 * Badge showing the meeting link status:
 * - "✅ Google Meet Ready" — auto-generated or manually set
 * - "⏳ Link Pending" — manual mode, mentor hasn't set it yet
 * - "🔗 Manual Mode" — manual mode, link has been set
 */
export function MeetingLinkStatus({
  meetingProvider,
  meetingUrlPending,
  className,
}: MeetingLinkStatusProps) {
  if (!meetingProvider) return null

  if (meetingUrlPending) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20",
          className
        )}
      >
        <Clock className="size-3" />
        Link Pending
      </Badge>
    )
  }

  if (meetingProvider === "GOOGLE_MEET") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 bg-green-500/10 text-green-500 border-green-500/20",
          className
        )}
      >
        <CheckCircle2 className="size-3" />
        Google Meet Ready
      </Badge>
    )
  }

  // MANUAL_GOOGLE_MEET and link is set
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20",
        className
      )}
    >
      <LinkIcon className="size-3" />
      Meet Link Set
    </Badge>
  )
}

