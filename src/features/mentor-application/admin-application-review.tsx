/**
 * ─── ADMIN APPLICATION REVIEW ────────────────────────────────────────────────
 *
 * Admin panel for reviewing, approving, and rejecting mentor applications.
 * Uses DataExplorer for search/filter/pagination.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from 'nextjs-toploader/app';
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  IndianRupee,
  Loader2,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { searchApplications } from "./api/mentor-application.api"
import {
  useApproveApplication,
  usePermanentlyRejectApplication,
  useRejectApplication,
  useRevokeMentor,
} from "./api/mentor-application.hooks"
import type {
  MentorApplicationResponse,
  MentorApplicationStatus,
} from "./api/mentor-application.types"

// ─── Filter Config ────────────────────────────────────────────────────────────

const APPLICATION_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["headline", "bio", "userName", "userEmail"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Permanently Rejected", value: "PERMANENTLY_REJECTED" },
        { label: "Withdrawn", value: "WITHDRAWN" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Applied Date", type: "INSTANT" },
    { field: "yearsOfExperience", label: "Experience (years)", type: "INTEGER" },
  ],
  sortFields: [
    { field: "createdAt", label: "Applied Date" },
    { field: "status", label: "Status" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MentorApplicationStatus }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
    case "APPROVED":
      return <Badge className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>
    case "REJECTED":
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
    case "PERMANENTLY_REJECTED":
      return <Badge variant="destructive"><Ban className="mr-1 h-3 w-3" />Permanent</Badge>
    case "WITHDRAWN":
      return <Badge variant="outline">Withdrawn</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<MentorApplicationResponse>[] = [
  { key: "userName", header: "Applicant", sortable: false },
  { key: "headline", header: "Headline", sortable: false, hideOnMobile: true },
  { key: "yearsOfExperience", header: "Exp (yrs)", sortable: true, hideOnMobile: true },
  { key: "proposedPriceInrPaise", header: "Proposed Price", sortable: false, hideOnMobile: true },
  { key: "status", header: "Status", sortable: true },
  { key: "createdAt", header: "Applied", sortable: true, hideOnMobile: true },
  { key: "actions", header: "Actions", sortable: false },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminApplicationReview() {
  const router = useRouter()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [permRejectDialogOpen, setPermRejectDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  const search = useGenericSearch<MentorApplicationResponse>({
    queryKey: "mentor-application-search",
    searchFn: searchApplications,
    config: APPLICATION_FILTER_CONFIG,
  })

  const approveMutation = useApproveApplication(() => search.refetch())
  const rejectMutation = useRejectApplication(() => {
    setRejectDialogOpen(false)
    setRejectionReason("")
    search.refetch()
  })
  const permRejectMutation = usePermanentlyRejectApplication(() => {
    setPermRejectDialogOpen(false)
    setRejectionReason("")
    search.refetch()
  })
  const revokeMutation = useRevokeMentor(() => search.refetch())

  const handleReject = () => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) return
    rejectMutation.mutate({ id: selectedId, data: { reason: rejectionReason } })
  }

  const handlePermReject = () => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) return
    permRejectMutation.mutate({ id: selectedId, data: { reason: rejectionReason } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentor Applications</h1>
        <p className="text-muted-foreground">
          Review and manage professional mentor applications.
        </p>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(app) => (
          <TableRow
            key={app.applicationId}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => {
              router.push(`${PATH_CONSTANTS.ADMIN_MENTOR_APPLICATIONS}/${app.applicationId}`)
            }
          }
          >
            <TableCell>
              <div>
                <p className="font-medium">{app.userName}</p>
                <p className="text-xs text-muted-foreground">{app.userEmail}</p>
              </div>
            </TableCell>
            <TableCell className="hidden max-w-50 truncate md:table-cell">{app.headline}</TableCell>
            <TableCell className="hidden md:table-cell">{app.yearsOfExperience}</TableCell>
            <TableCell className="hidden md:table-cell">
              {app.proposedPriceInrPaise != null ? (
                <div className="flex items-center gap-1 text-sm">
                  <IndianRupee className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{(app.proposedPriceInrPaise / 100).toLocaleString("en-IN")}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">—</span>
              )}
            </TableCell>
            <TableCell><StatusBadge status={app.status} /></TableCell>
            <TableCell className="hidden md:table-cell">
              {new Date(app.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-wrap items-center gap-1.5">
                {app.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      className="h-7 gap-1 bg-green-600 px-2.5 text-xs text-white hover:bg-green-700"
                      onClick={() => approveMutation.mutate(app.applicationId)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1 px-2.5 text-xs"
                      onClick={() => {
                        setSelectedId(app.applicationId)
                        setRejectionReason("")
                        setRejectDialogOpen(true)
                      }}
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 border-destructive/40 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setSelectedId(app.applicationId)
                        setRejectionReason("")
                        setPermRejectDialogOpen(true)
                      }}
                    >
                      <Ban className="h-3 w-3" />
                      Block
                    </Button>
                  </>
                )}
                {app.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1 px-2.5 text-xs"
                    onClick={() => revokeMutation.mutate(app.userId)}
                    disabled={revokeMutation.isPending}
                  >
                    {revokeMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    Revoke
                  </Button>
                )}
                {app.linkedinUrl && (
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" asChild>
                    <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The applicant can reapply after 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (min 10 characters)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectionReason.length < 10 || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanently Reject Dialog */}
      <Dialog open={permRejectDialogOpen} onOpenChange={setPermRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Reject Application</DialogTitle>
            <DialogDescription>
              This will prevent the applicant from ever reapplying. Use with caution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (min 10 characters)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain the reason for permanent rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermReject}
              disabled={rejectionReason.length < 10 || permRejectMutation.isPending}
            >
              {permRejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Permanently Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

