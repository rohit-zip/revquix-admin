"use client"

/**
 * ─── SESSIONS ─────────────────────────────────────────────────────────────────
 *
 * Every V2 booking, in one table. This did not exist in any form before: the only ways to see a
 * booking were the call snapshot's capped "next 24 hours" sample and an inspect-by-id endpoint you
 * needed the id for.
 *
 * <h3>The tabs are saved filters, not separate queries</h3>
 * Each one applies a status filter to the same endpoint. "Needs attention" is the exception and the
 * reason the tab strip earns its place: it is not one status but the union of five conditions
 * (no meeting link, past auto-complete, awaiting confirmation, feedback overdue, under dispute), and
 * every one of those is computed server-side on the row so the table and the lifecycle sweep that
 * acts on the same bookings cannot disagree about what "needs attention" means.
 *
 * Because it is a union rather than a filter the server can express, this tab filters the current
 * page client-side and says so — see the note rendered under it. That is honest and cheap; a
 * server-side predicate for it belongs with the job-health work, not here.
 */

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarClock, CheckCircle2, LinkIcon, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterCriteria } from "@/core/filters"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { searchBookings } from "@/features/mentorship-v2/api/admin-lists.api"
import { SESSIONS_FILTER_CONFIG } from "@/features/mentorship-v2/api/admin-lists.config"
import type { AdminBookingRow } from "@/features/mentorship-v2/api/admin-lists.types"
import { PersonCell, RefLink, StatusBadge, formatMinor, formatWhen } from "./console-format"

type Tab = "all" | "upcoming" | "attention" | "completed" | "cancelled"

const CANCELLED_STATUSES = [
  "CANCELLED_BY_USER",
  "CANCELLED_BY_MENTOR",
  "CANCELLED_BY_SYSTEM",
  "NO_SHOW_USER",
  "NO_SHOW_MENTOR",
  "NO_SHOW_BOTH",
  "EXPIRED",
]

const TAB_FILTERS: Record<Tab, FilterCriteria[]> = {
  all: [],
  upcoming: [{ field: "status", operator: "IN", value: ["CONFIRMED", "RESCHEDULED"] }],
  // Deliberately broad: the client narrows this page to rows the server flagged. See the file note.
  attention: [],
  completed: [{ field: "status", operator: "EQUALS", value: "COMPLETED" }],
  cancelled: [{ field: "status", operator: "IN", value: CANCELLED_STATUSES }],
}

export default function ProfessionalMentorSessionsView() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("all")

  const search = useGenericSearch<AdminBookingRow>({
    queryKey: `pm-sessions-${tab}`,
    searchFn: searchBookings,
    config: SESSIONS_FILTER_CONFIG,
    permanentFilters: TAB_FILTERS[tab],
  })

  const rows = search.data?.content ?? []
  const visibleRows = tab === "attention" ? rows.filter((row) => row.needsAttention) : rows

  const columns = useMemo<DataColumn<AdminBookingRow>[]>(
    () => [
      {
        key: "bookingId",
        header: "Session",
        render: (row) => (
          <div className="min-w-0">
            <RefLink id={row.bookingId} href={`${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${row.bookingId}`} />
            <p className="mt-0.5 truncate text-xs">{row.serviceTitle ?? row.serviceId}</p>
          </div>
        ),
      },
      {
        key: "startsAt",
        header: "Scheduled",
        sortable: true,
        render: (row) => (
          <div className="min-w-0 whitespace-nowrap">
            <p className="text-xs">{formatWhen(row.startsAt)}</p>
            {row.durationMinutes ? (
              <p className="text-[10px] text-muted-foreground">{row.durationMinutes} min</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => (
          <div className="space-y-1">
            <StatusBadge status={row.status} label={row.statusLabel} />
            {row.disputeId ? (
              <div>
                <RefLink
                  id={row.disputeId}
                  href={`${PATH_CONSTANTS.ADMIN_PM_DISPUTES}/${row.disputeId}`}
                />
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: "mentor",
        header: "Mentor",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.mentorName} userId={row.mentorUserId} />,
      },
      {
        key: "buyer",
        header: "Buyer",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.buyerName} userId={row.buyerUserId} />,
      },
      {
        key: "meetingLinkSource",
        header: "Link",
        sortable: true,
        render: (row) =>
          row.hasMeetingLink ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs">
              <LinkIcon className="size-3" aria-hidden="true" />
              {row.meetingLinkSource === "GOOGLE_MEET" ? "Meet" : "Manual"}
            </span>
          ) : row.meetingLinkMissing ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-destructive">
              <AlertTriangle className="size-3" aria-hidden="true" /> missing
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "joins",
        header: "Joined",
        hideOnMobile: true,
        render: (row) => (
          <div className="flex gap-1">
            <Badge variant={row.mentorJoined ? "secondary" : "outline"} className="h-4 px-1 text-[10px]">
              M
            </Badge>
            <Badge variant={row.buyerJoined ? "secondary" : "outline"} className="h-4 px-1 text-[10px]">
              B
            </Badge>
          </div>
        ),
      },
      {
        key: "feedbackDeadlineAt",
        header: "Feedback",
        sortable: true,
        render: (row) => {
          if (!row.feedbackRequired) {
            return <span className="text-xs text-muted-foreground">n/a</span>
          }
          if (row.feedbackSubmitted) {
            return (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-emerald-600">
                <CheckCircle2 className="size-3" aria-hidden="true" /> filed
              </span>
            )
          }
          if (row.feedbackOverdue) {
            return (
              <span className="whitespace-nowrap text-xs font-medium text-destructive">overdue</span>
            )
          }
          return <span className="whitespace-nowrap text-xs">due {formatWhen(row.feedbackDeadlineAt)}</span>
        },
      },
      {
        key: "amount",
        header: "Amount",
        hideOnMobile: true,
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {formatMinor(row.amountMinor, row.currency)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Video className="size-6" /> Sessions
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every Professional Mentor session, newest first. Open one for its timeline, join evidence,
          notification log and the admin actions that force a completion or a feedback submission.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarClock className="size-3.5" /> Upcoming
          </TabsTrigger>
          <TabsTrigger value="attention" className="gap-1.5">
            <AlertTriangle className="size-3.5" /> Needs attention
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled &amp; no-show</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "attention" ? (
        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          &quot;Needs attention&quot; is the union of five conditions — no meeting link on a confirmed
          future session, past the auto-complete deadline, awaiting attendance confirmation, feedback
          overdue, or under dispute. The server computes the flag per row; this tab filters the rows
          on the current page by it, so the page count above still describes the unfiltered query.
        </p>
      ) : null}

      <DataExplorer
        search={{ ...search, data: search.data ? { ...search.data, content: visibleRows } : undefined }}
        columns={columns}
        getRowKey={(row) => row.bookingId}
        title="Sessions"
        description="Filter by status, mentor, buyer, link state or date range."
        onRowClick={(row) => router.push(`${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${row.bookingId}`)}
      />
    </div>
  )
}
