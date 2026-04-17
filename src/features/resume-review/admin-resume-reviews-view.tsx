"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { searchAllBookings } from "./api/resume-review.api"
import type { ResumeReviewBookingResponse } from "./api/resume-review.types"

const STATUS_MAP: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  PENDING_PAYMENT: { variant: "secondary", label: "Pending Payment" },
  PENDING_ACCEPTANCE: { variant: "secondary", label: "Pending Acceptance" },
  IN_PROGRESS: { variant: "default", label: "In Progress" },
  REPORT_SUBMITTED: { variant: "default", label: "Report Ready" },
  COMPLETED: { variant: "outline", label: "Completed" },
  CANCELLED_BY_USER: { variant: "destructive", label: "Cancelled (User)" },
  CANCELLED_BY_ADMIN: { variant: "destructive", label: "Cancelled (Admin)" },
  PAYMENT_FAILED: { variant: "destructive", label: "Payment Failed" },
  EXPIRED: { variant: "outline", label: "Expired" },
}

function getStatusBadge(status: string) {
  const info = STATUS_MAP[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

const FILTER_CONFIG: FilterConfig = {
  searchableFields: ["userAuth.name", "userAuth.email", "reviewer.name"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: Object.entries(STATUS_MAP).map(([value, { label }]) => ({ value, label })),
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Booked Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Booked Date" },
    { field: "status", label: "Status" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

const columns: DataColumn<ResumeReviewBookingResponse>[] = [
  { key: "bookingId", header: "Booking ID", sortable: false },
  { key: "userName", header: "User", sortable: false },
  { key: "planName", header: "Plan", sortable: false },
  { key: "reviewerName", header: "Reviewer", sortable: false },
  { key: "finalAmountMinor", header: "Amount", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "createdAt", header: "Booked", sortable: true },
]

export default function AdminResumeReviewsView() {
  const router = useRouter()
  const search = useGenericSearch<ResumeReviewBookingResponse>({
    queryKey: "admin-resume-reviews",
    searchFn: searchAllBookings,
    config: FILTER_CONFIG,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Reviews</h1>
        <p className="text-muted-foreground">Manage all resume review bookings.</p>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(booking) => (
          <TableRow
            key={booking.bookingId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`/resume-reviews/${booking.bookingId}`)}
          >
            <TableCell className="font-mono text-xs">{booking.bookingId.slice(0, 8)}…</TableCell>
            <TableCell>
              <p className="font-medium">{booking.userName}</p>
              <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
            </TableCell>
            <TableCell>{booking.planName}</TableCell>
            <TableCell>{booking.reviewerName ?? "—"}</TableCell>
            <TableCell>{formatAmount(booking.finalAmountMinor, booking.currency)}</TableCell>
            <TableCell>{getStatusBadge(booking.status)}</TableCell>
            <TableCell>{formatDate(booking.createdAt)}</TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}

