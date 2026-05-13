/**
 * ─── ADMIN BLOG REPORTS VIEW ──────────────────────────────────────────────────
 *
 * Admin panel for reviewing user-submitted blog content reports.
 * Supports tab filtering by report status: All / Pending / Dismissed / Actioned.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
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

import { useAdminBlogReports, useActionBlogReport } from "./api/admin-blog.hooks"
import type { AdminBlogReport, ReportStatus } from "./api/admin-blog.types"
import { REPORT_STATUS } from "./api/admin-blog.types"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

// ─── Constants ────────────────────────────────────────────────────────────────

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || "https://www.revquix.com"

const STATUS_TABS: { label: string; value: ReportStatus | "ALL"; icon?: React.ReactNode }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: REPORT_STATUS.PENDING,   icon: <Clock className="h-3.5 w-3.5" /> },
  { label: "Dismissed", value: REPORT_STATUS.DISMISSED, icon: <XCircle className="h-3.5 w-3.5" /> },
  { label: "Actioned", value: REPORT_STATUS.ACTIONED,  icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReasonBadge(reason: string) {
  const labelMap: Record<string, string> = {
    SPAM:          "Spam",
    PLAGIARISM:    "Plagiarism",
    MISINFORMATION: "Misinformation",
    INAPPROPRIATE: "Inappropriate",
    IMPERSONATION: "Impersonation",
    OTHER:         "Other",
  }
  return <Badge variant="outline">{labelMap[reason] ?? reason}</Badge>
}

function getStatusBadge(status: string) {
  if (status === "PENDING")    return <Badge variant="destructive">Pending</Badge>
  if (status === "DISMISSED")  return <Badge variant="outline">Dismissed</Badge>
  if (status === "ACTIONED")   return <Badge variant="secondary">Actioned</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminBlogReportsView() {
  const router = useRouter()
  const [page, setPage]           = useState(0)
  const [activeTab, setActiveTab] = useState<ReportStatus | "ALL">("PENDING")

  const statusFilter = activeTab === "ALL" ? undefined : activeTab

  const { data, isLoading, refetch, isRefetching } = useAdminBlogReports(page, 20, statusFilter)
  const actionReport = useActionBlogReport()

  const reports    = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const handleTabChange = (value: string) => {
    setActiveTab(value as ReportStatus | "ALL")
    setPage(0)
  }

  const handleAction = (reportId: number, status: "DISMISSED" | "ACTIONED") => {
    actionReport.mutate({ reportId, status })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Reports Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review user-submitted content reports and take moderation action.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {data?.totalElements ?? 0} report{data?.totalElements !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Blog Post</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="w-44 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : reports.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        No reports found
                      </TableCell>
                    </TableRow>
                    )
                  : reports.map((report: AdminBlogReport) => (
                    <TableRow key={report.reportId}>
                      {/* Blog Post */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="font-medium text-sm hover:underline text-left line-clamp-2 cursor-pointer"
                            onClick={() =>
                              router.push(`${PATH_CONSTANTS.ADMIN_BLOG_DETAIL}/${report.blogId}`)
                            }
                          >
                            {report.blogTitle}
                          </button>
                          <a
                            href={`${WEB_BASE}/blogs/${report.blogId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            title="View on site"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>

                      {/* Reporter */}
                      <TableCell>
                        <p className="text-sm">{report.reporterName ?? "—"}</p>
                        {report.reporterUserId && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {report.reporterUserId.slice(0, 8)}…
                          </p>
                        )}
                      </TableCell>

                      {/* Reason */}
                      <TableCell>{getReasonBadge(report.reason)}</TableCell>

                      {/* Description */}
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                          {report.description || <span className="italic">No description</span>}
                        </p>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(report.status)}</TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(report.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {report.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(report.reportId, "DISMISSED")}
                              disabled={actionReport.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" />
                              Dismiss
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction(report.reportId, "ACTIONED")}
                              disabled={actionReport.isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              Action
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-right">
                            {report.actionedAt ? formatDate(report.actionedAt) : "Reviewed"}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
