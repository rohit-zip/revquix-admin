/**
 * ─── ALL BOOKINGS VIEW ──────────────────────────────────────────────────────
 *
 * Admin / Business-Mentor view for /business-mentor/all-bookings.
 *
 * Powered by the generic filter engine:
 *   • useGenericSearch  — state management + React Query
 *   • DataExplorer      — filter panel, table, pagination
 *   • ALL_BOOKINGS_FILTER_CONFIG — field whitelist
 *   • searchAllBookings — POST /business-mentor/bookings/all/search
 *
 * Supports:
 *   – Status filter (EQUALS / NOT_EQUALS / IN)
 *   – Date range on createdAt, updatedAt, cancelledAt
 *   – Join filters: user email/name & mentor email/name
 *   – Multi-column sort (defaults to createdAt DESC)
 *   – Pagination with page-size selector
 */

"use client"

import React from "react"
import {
  CheckCircle2,
  Clock,
  Hourglass,
  UserX,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { useGenericSearch } from "@/core/filters"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { JoinMeetingButton } from "@/components/join-meeting-button"

import { searchAllBookings } from "./api/all-bookings-search.api"
import { ALL_BOOKINGS_FILTER_CONFIG } from "./api/all-bookings-search.config"
import type { BookingResponse, BookingStatus } from "./api/all-bookings-search.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInstant(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  CONFIRMED: {
    label: "Confirmed",
    variant: "default",
    icon: <CheckCircle2 className="size-3" />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default",
    icon: <Hourglass className="size-3" />,
  },
  COMPLETED: {
    label: "Completed",
    variant: "secondary",
    icon: <CheckCircle2 className="size-3" />,
  },
  CANCELLED_BY_USER: {
    label: "Cancelled (User)",
    variant: "destructive",
    icon: <UserX className="size-3" />,
  },
  CANCELLED_BY_MENTOR: {
    label: "Cancelled (Mentor)",
    variant: "destructive",
    icon: <XCircle className="size-3" />,
  },
  NO_SHOW: {
    label: "No Show",
    variant: "outline",
    icon: <Clock className="size-3" />,
  },
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
    icon: null,
  }
  return (
    <Badge variant={cfg.variant} className="gap-1 text-xs whitespace-nowrap">
      {cfg.icon}
      {cfg.label}
    </Badge>
  )
}

// ─── Category Badge ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  BUSINESS_STARTUP:       "Business Startup",
  PROFESSIONAL_DEVELOPER: "Professional Dev",
  HIRING_RECRUITMENT:     "Hiring & Recruitment",
}

function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className="text-xs whitespace-nowrap">
      {CATEGORY_LABELS[category] ?? category}
    </Badge>
  )
}


// ─── Column Definitions ───────────────────────────────────────────────────────

const BOOKING_COLUMNS: DataColumn<BookingResponse>[] = [
  {
    key: "bookingId",
    header: "Booking ID",
    render: (b) => (
      <span className="font-mono text-xs text-muted-foreground">{b.bookingId}</span>
    ),
  },
  {
    key: "user",
    header: "Client",
    render: (b) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{b.userName || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{b.userEmail}</p>
      </div>
    ),
  },
  {
    key: "mentor",
    header: "Mentor",
    hideOnMobile: true,
    render: (b) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{b.mentorName || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{b.mentorEmail}</p>
      </div>
    ),
  },
  {
    key: "category",
    header: "Category",
    hideOnMobile: true,
    render: (b) => <CategoryBadge category={b.category} />,
  },
  {
    key: "scheduledAt",
    header: "Scheduled At",
    hideOnMobile: true,
    render: (b) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatInstant(b.scheduledAt)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (b) => <BookingStatusBadge status={b.status} />,
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    hideOnMobile: true,
    render: (b) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(b.createdAt)}
      </span>
    ),
  },
  {
    key: "meetingUrl",
    header: "Meeting",
    render: (b) => <JoinMeetingButton sessionId={b.sessionId} allowedJoinAt={b.allowedJoinAt} variant="icon" />,
  },
]

// ─── Empty State ──────────────────────────────────────────────────────────────

function BookingsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CheckCircle2 className="mb-4 size-12 text-muted-foreground/30" />
      <h3 className="text-base font-semibold">No bookings found</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        No bookings match your current filters. Try adjusting the filters or clearing them.
      </p>
    </div>
  )
}

// ─── View Component ───────────────────────────────────────────────────────────

export default function AllBookingsView() {
  const search = useGenericSearch<BookingResponse>({
    queryKey: "admin-all-bookings-search",
    searchFn: searchAllBookings,
    config: ALL_BOOKINGS_FILTER_CONFIG,
  })

  return (
    <DataExplorer<BookingResponse>
      search={search}
      columns={BOOKING_COLUMNS}
      getRowKey={(b) => b.bookingId}
      title="All Bookings"
      description="System-wide view of every booking. Filter by status, user, mentor, date range, and more."
      emptyState={<BookingsEmptyState />}
    />
  )
}
