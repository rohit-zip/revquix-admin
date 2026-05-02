/**
 * ─── ADMIN SESSION DISPUTES VIEW ─────────────────────────────────────────────
 *
 * Admin panel list view for all session disputes.
 * Supports tab-based filtering by dispute status.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useDisputesList } from "./api/session-disputes.hooks"
import type { DisputeStatus, SessionDisputeResponse } from "./api/session-disputes.types"
import { DISPUTE_STATUS } from "./api/session-disputes.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: DisputeStatus) {
  const map: Record<DisputeStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    OPEN: { variant: "destructive", label: "Open" },
    UNDER_REVIEW: { variant: "secondary", label: "Under Review" },
    RESOLVED_COMPLETED: { variant: "outline", label: "Resolved — Completed" },
    RESOLVED_NO_SHOW_USER: { variant: "outline", label: "Resolved — No Show (User)" },
    RESOLVED_NO_SHOW_MENTOR: { variant: "outline", label: "Resolved — No Show (Mentor)" },
    RESOLVED_FEEDBACK_LATE: { variant: "outline", label: "Resolved — Late Feedback" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function getBookingTypeBadge(type: string) {
  if (type === "MOCK_INTERVIEW") return <Badge variant="secondary">Mock Interview</Badge>
  if (type === "HOURLY_SESSION") return <Badge variant="secondary">Hourly Session</Badge>
  return <Badge variant="outline">{type}</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: DisputeStatus | "ALL"; icon: React.ReactNode }[] = [
  { label: "All", value: "ALL", icon: null },
  { label: "Open", value: DISPUTE_STATUS.OPEN, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { label: "Under Review", value: DISPUTE_STATUS.UNDER_REVIEW, icon: <Shield className="h-3.5 w-3.5" /> },
  { label: "Resolved", value: DISPUTE_STATUS.RESOLVED_COMPLETED, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
]

export function AdminDisputesView() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [activeTab, setActiveTab] = useState<DisputeStatus | "ALL">("ALL")

  const statusFilter = activeTab === "ALL" ? undefined : activeTab

  // For "Resolved" tab, fetch all resolved statuses by not passing status
  // (backend returns all if no filter; UI filters client-side for resolved)
  const { data, isLoading, refetch, isRefetching } = useDisputesList(page, 20, statusFilter)

  const disputes = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const handleTabChange = (value: string) => {
    setActiveTab(value as DisputeStatus | "ALL")
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Disputes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and resolve attendance disputes raised after sessions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {data?.totalElements ?? 0} dispute{data?.totalElements !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>User Responded</TableHead>
                <TableHead>Mentor Responded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : disputes.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        No disputes found
                      </TableCell>
                    </TableRow>
                    )
                  : disputes.map((dispute: SessionDisputeResponse) => (
                    <TableRow
                      key={dispute.disputeId}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        router.push(`${PATH_CONSTANTS.ADMIN_SESSION_DISPUTES}/${dispute.disputeId}`)
                      }
                    >
                      <TableCell className="font-mono text-xs">{dispute.disputeId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{dispute.userName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{dispute.userEmail ?? ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{dispute.mentorName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{dispute.mentorEmail ?? ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getBookingTypeBadge(dispute.bookingType)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dispute.raisedByRole ?? "System"}</Badge>
                      </TableCell>
                      <TableCell>
                        {dispute.userResponded === null ? (
                          <Clock className="h-4 w-4 text-muted-foreground" aria-label="No response yet" />
                        ) : dispute.userResponded === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Said: Session DID happen" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" aria-label="Said: Session did NOT happen" />
                        )}
                      </TableCell>
                      <TableCell>
                        {dispute.mentorResponded === null ? (
                          <Clock className="h-4 w-4 text-muted-foreground" aria-label="No response yet" />
                        ) : dispute.mentorResponded === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Said: Session DID happen" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" aria-label="Said: Session did NOT happen" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute.disputeStatus)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(dispute.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
