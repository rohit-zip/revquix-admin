/**
 * ─── ADMIN PAYOUTS VIEW (Phase 2 + Phase 5) ──────────────────────────────────
 *
 * Admin panel for managing mentor payouts.
 *
 * Phase 2 additions:
 *   • Analytics stats row — live counts + amounts per status
 *   • Bulk-process — select multiple PENDING rows, process in one click
 *   • Payout detail side-panel — click any row to see the full breakdown +
 *     audit trail
 *   • ON_HOLD actions — "Hold" button for PENDING/PROCESSING, "Release" for
 *     ON_HOLD
 *   • Hold dialog — optional reason input before placing a payout on hold
 *
 * Phase 5 additions:
 *   • "Needs Review" quick-filter tab — surfaces requiresReview=true payouts
 *   • Warning badge on table rows + detail sheet for payouts requiring review
 *   • Override amount dialog — admin can set a custom payout amount with a reason
 *   • Process confirmation dialog — blocks processing requiresReview payouts
 *     until admin explicitly acknowledges the associated refund
 *   • Refund info section in detail sheet — shows refundIssued, refundAmountMinor
 *   • Override info section in detail sheet — shows adminOverrideAmountMinor,
 *     adminOverrideReason, effective payout amount on completion
 */

"use client"

import { useState, useCallback } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TableCell, TableRow } from "@/components/ui/table"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchPayouts } from "@/features/professional-mentor/api/professional-mentor.api"
import {
  useBulkProcessPayouts,
  useCompletePayout,
  useHoldPayout,
  useOverridePayoutAmount,
  usePayoutAuditLog,
  usePayoutStats,
  useProcessPayout,
  useReleasePayout,
} from "@/features/professional-mentor/api/professional-mentor.hooks"
import type {
  MentorPayoutResponse,
  PayoutStatus,
} from "@/features/professional-mentor/api/professional-mentor.types"

// ─── Filter Config ────────────────────────────────────────────────────────────

const PAYOUT_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["mentorUserId"],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Processing", value: "PROCESSING" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Failed", value: "FAILED" },
        { label: "On Hold", value: "ON_HOLD" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Created Date", type: "INSTANT" },
    { field: "paidAt", label: "Paid Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Created Date" },
    { field: "payoutAmountMinor", label: "Net Amount" },
    { field: "status", label: "Status" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<MentorPayoutResponse>[] = [
  { key: "select", header: "", sortable: false },
  { key: "payoutId", header: "Payout ID", sortable: false },
  { key: "mentorName", header: "Mentor", sortable: false },
  { key: "grossAmountMinor", header: "Gross", sortable: false },
  { key: "platformFeeMinor", header: "Fee", sortable: false },
  { key: "payoutAmountMinor", header: "Net Payout", sortable: true },
  { key: "commissionPercentage", header: "Comm.", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "createdAt", header: "Date", sortable: true },
  { key: "actions", header: "", sortable: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPayoutBadge(status: PayoutStatus) {
  switch (status) {
    case "PENDING":    return <Badge variant="secondary">Pending</Badge>
    case "PROCESSING": return <Badge className="bg-blue-600 text-white">Processing</Badge>
    case "COMPLETED":  return <Badge className="bg-green-600 text-white">Completed</Badge>
    case "FAILED":     return <Badge variant="destructive">Failed</Badge>
    case "ON_HOLD":    return <Badge variant="outline" className="border-amber-500 text-amber-600">On Hold</Badge>
    default:           return <Badge variant="outline">{status}</Badge>
  }
}

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    PROCESS_INITIATED:       "Moved to Processing",
    COMPLETED:               "Marked Completed",
    HELD_BY_ADMIN:           "Placed On Hold (Admin)",
    RELEASED_BY_ADMIN:       "Released from Hold (Admin)",
    AUTO_FAILED:             "Auto-Failed",
    BULK_PROCESSED:          "Bulk Processed",
    HELD_FOR_FEEDBACK:       "Held — Awaiting Feedback",
    RELEASED_AFTER_FEEDBACK: "Released after Feedback",
    AMOUNT_OVERRIDDEN:       "Payout Amount Overridden",
  }
  return map[action] ?? action
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  count,
  amount,
  currency = "INR",
  icon,
  colorClass,
}: {
  label: string
  count: number
  amount: number
  currency?: string
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <Card className="flex-1 min-w-40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`${colorClass}`}>{icon}</span>
        </div>
        <p className="text-xl font-bold">{formatAmount(amount, currency)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{count} payout{count !== 1 ? "s" : ""}</p>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPayoutsView() {
  // ── Complete dialog state ──────────────────────────────────────────────────
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedPayoutId, setSelectedPayoutId] = useState("")
  const [payoutReference, setPayoutReference] = useState("")
  const [adminNote, setAdminNote] = useState("")

  // ── Hold dialog state ──────────────────────────────────────────────────────
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [holdPayoutId, setHoldPayoutId] = useState("")
  const [holdReason, setHoldReason] = useState("")

  // ── Phase 5: Override amount dialog state ─────────────────────────────────
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overridePayoutId, setOverridePayoutId] = useState("")
  const [overrideAmount, setOverrideAmount] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  /** The gross amount (INR minor) of the payout being overridden — for display */
  const [overrideGross, setOverrideGross] = useState<number | null>(null)

  // ── Phase 5: Process confirmation dialog (requiresReview) ─────────────────
  const [processConfirmOpen, setProcessConfirmOpen] = useState(false)
  const [processConfirmPayout, setProcessConfirmPayout] = useState<MentorPayoutResponse | null>(null)

  // ── Detail sheet state ─────────────────────────────────────────────────────
  const [detailPayout, setDetailPayout] = useState<MentorPayoutResponse | null>(null)

  // ── Bulk selection ─────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── Phase 5: Needs Review quick-filter ────────────────────────────────────
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false)

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  // ── Data ───────────────────────────────────────────────────────────────────
  const search = useGenericSearch<MentorPayoutResponse>({
    queryKey: "admin-payouts",
    searchFn: searchPayouts,
    config: PAYOUT_FILTER_CONFIG,
    permanentFilters: needsReviewOnly
      ? [{ field: "requiresReview", operator: "EQUALS" as const, value: "true" }]
      : undefined,
  })

  const { data: stats } = usePayoutStats()
  const { data: auditLog, isLoading: auditLoading } = usePayoutAuditLog(detailPayout?.payoutId ?? null)

  // ── Mutations ──────────────────────────────────────────────────────────────
  const processMutation = useProcessPayout(() => search.refetch())

  const completeMutation = useCompletePayout(() => {
    setCompleteDialogOpen(false)
    setPayoutReference("")
    setAdminNote("")
    search.refetch()
  })

  const bulkMutation = useBulkProcessPayouts(() => {
    clearSelection()
    search.refetch()
  })

  const holdMutation = useHoldPayout(() => {
    setHoldDialogOpen(false)
    setHoldPayoutId("")
    setHoldReason("")
    search.refetch()
    if (detailPayout?.payoutId === holdPayoutId) setDetailPayout(null)
  })

  const releaseMutation = useReleasePayout(() => {
    search.refetch()
    if (detailPayout) setDetailPayout(null)
  })

  const overrideMutation = useOverridePayoutAmount(() => {
    setOverrideDialogOpen(false)
    setOverridePayoutId("")
    setOverrideAmount("")
    setOverrideReason("")
    setOverrideGross(null)
    search.refetch()
    if (detailPayout?.payoutId === overridePayoutId) setDetailPayout(null)
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openCompleteDialog = (payoutId: string) => {
    setSelectedPayoutId(payoutId)
    setPayoutReference("")
    setAdminNote("")
    setCompleteDialogOpen(true)
  }

  const openHoldDialog = (payoutId: string) => {
    setHoldPayoutId(payoutId)
    setHoldReason("")
    setHoldDialogOpen(true)
  }

  const openOverrideDialog = (payout: MentorPayoutResponse) => {
    setOverridePayoutId(payout.payoutId)
    setOverrideAmount(
      payout.adminOverrideAmountMinor != null
        ? String(payout.adminOverrideAmountMinor)
        : String(payout.payoutAmountMinor),
    )
    setOverrideReason(payout.adminOverrideReason ?? "")
    setOverrideGross(payout.grossAmountMinor)
    setOverrideDialogOpen(true)
  }

  const handleProcessClick = (payout: MentorPayoutResponse) => {
    if (payout.requiresReview) {
      setProcessConfirmPayout(payout)
      setProcessConfirmOpen(true)
    } else {
      processMutation.mutate(payout.payoutId)
    }
  }

  const selectedCount = selectedIds.size

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payout Management</h1>
          <p className="text-muted-foreground">Process and manage mentor payouts.</p>
        </div>
        {/* Phase 5: Needs Review quick-filter */}
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant={needsReviewOnly ? "default" : "outline"}
            className={needsReviewOnly
              ? "bg-amber-600 hover:bg-amber-700 border-amber-600"
              : "border-amber-500 text-amber-600 hover:bg-amber-50"}
            onClick={() => {
              setNeedsReviewOnly((v) => !v)
              clearSelection()
            }}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            {needsReviewOnly ? "Showing: Needs Review" : "Needs Review"}
          </Button>
          {needsReviewOnly && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setNeedsReviewOnly(false); clearSelection() }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Analytics Cards ──────────────────────────────────────────────── */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Pending"
            count={stats.pendingCount}
            amount={stats.pendingAmountMinor}
            icon={<Clock className="h-4 w-4" />}
            colorClass="text-orange-500"
          />
          <StatCard
            label="Processing"
            count={stats.processingCount}
            amount={stats.processingAmountMinor}
            icon={<RefreshCw className="h-4 w-4" />}
            colorClass="text-blue-500"
          />
          <StatCard
            label="On Hold"
            count={stats.onHoldCount}
            amount={stats.onHoldAmountMinor}
            icon={<PauseCircle className="h-4 w-4" />}
            colorClass="text-amber-500"
          />
          <StatCard
            label="Completed"
            count={stats.completedCount}
            amount={stats.completedAmountMinor}
            icon={<CheckCircle2 className="h-4 w-4" />}
            colorClass="text-green-500"
          />
          <StatCard
            label="Failed"
            count={stats.failedCount}
            amount={stats.failedAmountMinor}
            icon={<XCircle className="h-4 w-4" />}
            colorClass="text-destructive"
          />
          <StatCard
            label="Total Obligation"
            count={stats.pendingCount + stats.processingCount + stats.onHoldCount}
            amount={stats.pendingObligationMinor}
            icon={<TrendingUp className="h-4 w-4" />}
            colorClass="text-primary"
          />
        </div>
      )}

      {/* ── Bulk Action Bar ───────────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedCount} payout{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <Button
            size="sm"
            className="h-7 bg-blue-600 hover:bg-blue-700"
            disabled={bulkMutation.isPending}
            onClick={() => bulkMutation.mutate(Array.from(selectedIds))}
          >
            {bulkMutation.isPending
              ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              : null}
            Bulk Process ({selectedCount})
          </Button>
          <Button size="sm" variant="ghost" className="h-7" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <DataExplorer<MentorPayoutResponse>
        search={search}
        columns={columns}
        renderRow={(payout) => {
          const isSelected = selectedIds.has(payout.payoutId)
          const isPending = payout.status === "PENDING"
          const needsReview = !!payout.requiresReview
          const hasOverride = payout.adminOverrideAmountMinor != null
          return (
            <TableRow
              key={payout.payoutId}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${needsReview ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.closest("button") || target.closest('[role="checkbox"]')) return
                setDetailPayout(payout)
              }}
            >
              {/* Selection checkbox (PENDING rows only) */}
              <TableCell className="w-8" onClick={(e) => e.stopPropagation()}>
                {isPending && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(payout.payoutId)}
                    aria-label={`Select payout ${payout.payoutId}`}
                  />
                )}
              </TableCell>

              <TableCell className="font-mono text-xs text-muted-foreground">
                {payout.payoutId}
              </TableCell>

              <TableCell className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{payout.mentorName ?? "—"}</span>
                  {needsReview && (
                    <AlertTriangle
                      className="h-3.5 w-3.5 text-amber-500 shrink-0"
                      aria-label="Needs review — refund issued"
                    />
                  )}
                </div>
                <div className="text-muted-foreground">{payout.mentorUserId}</div>
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                {formatAmount(payout.grossAmountMinor, payout.currency)}
              </TableCell>

              <TableCell className="text-xs text-muted-foreground">
                {formatAmount(payout.platformFeeMinor, payout.currency)}
              </TableCell>

              <TableCell className="font-medium">
                {hasOverride ? (
                  <div>
                    <span className="line-through text-muted-foreground text-xs mr-1">
                      {formatAmount(payout.payoutAmountMinor, payout.currency)}
                    </span>
                    <span className="text-amber-600">
                      {formatAmount(payout.adminOverrideAmountMinor, payout.currency)}
                    </span>
                  </div>
                ) : (
                  formatAmount(payout.payoutAmountMinor, payout.currency)
                )}
              </TableCell>

              <TableCell className="text-xs">{payout.commissionPercentage}%</TableCell>

              <TableCell>
                <div className="flex flex-col gap-0.5">
                  {getPayoutBadge(payout.status)}
                  {needsReview && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600 text-[10px] px-1 py-0"
                    >
                      Needs Review
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-xs">{formatDate(payout.createdAt)}</TableCell>

              {/* Actions */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 flex-wrap">
                  {payout.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant={needsReview ? "outline" : "outline"}
                        className={`h-7 ${needsReview ? "border-amber-500 text-amber-700 hover:bg-amber-50" : ""}`}
                        onClick={() => handleProcessClick(payout)}
                        disabled={processMutation.isPending}
                      >
                        {processMutation.isPending
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : needsReview
                            ? <><AlertTriangle className="h-3 w-3 mr-1" />Process</>
                            : "Process"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={() => openHoldDialog(payout.payoutId)}
                      >
                        Hold
                      </Button>
                    </>
                  )}

                  {(payout.status === "PENDING" || payout.status === "ON_HOLD") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => openOverrideDialog(payout)}
                    >
                      Override
                    </Button>
                  )}

                  {payout.status === "PROCESSING" && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-700"
                        onClick={() => openCompleteDialog(payout.payoutId)}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={() => openHoldDialog(payout.payoutId)}
                      >
                        Hold
                      </Button>
                    </>
                  )}

                  {payout.status === "ON_HOLD" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => releaseMutation.mutate(payout.payoutId)}
                      disabled={releaseMutation.isPending}
                    >
                      {releaseMutation.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : "Release"}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        }}
      />

      {/* ── Payout Detail Sheet ───────────────────────────────────────────── */}
      <Sheet open={!!detailPayout} onOpenChange={(open) => { if (!open) setDetailPayout(null) }}>
        <SheetContent className="w-110 sm:w-135 overflow-y-auto">
          {detailPayout && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2">
                  Payout Details
                  {getPayoutBadge(detailPayout.status)}
                  {detailPayout.requiresReview && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Needs Review
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>

              {/* ── ID / Reference ─────────────────────────────────────── */}
              <div className="space-y-4">
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <Row label="Payout ID" value={detailPayout.payoutId} mono />
                  <Row label="Payment Order" value={detailPayout.paymentOrderId} mono />
                  {detailPayout.payoutReference && (
                    <Row label="Bank Ref / TXN ID" value={detailPayout.payoutReference} mono />
                  )}
                </div>

                {/* ── Mentor ──────────────────────────────────────────── */}
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Mentor</p>
                  <Row label="Name" value={detailPayout.mentorName ?? "—"} />
                  <Row label="Email" value={detailPayout.mentorEmail ?? "—"} />
                  <Row label="User ID" value={detailPayout.mentorUserId} mono />
                </div>

                {/* ── Amount Breakdown ─────────────────────────────────── */}
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Amount Breakdown</p>
                  <Row label="Gross Amount" value={formatAmount(detailPayout.grossAmountMinor, detailPayout.currency)} />
                  <Row
                    label={`Platform Fee (${detailPayout.commissionPercentage}%)`}
                    value={detailPayout.platformFeeMinor != null
                      ? `− ${formatAmount(detailPayout.platformFeeMinor, detailPayout.currency)}`
                      : "—"}
                    valueClass="text-destructive"
                  />
                  {detailPayout.gstAmountMinor != null && (
                    <Row
                      label="GST on Fee"
                      value={`  ${formatAmount(detailPayout.gstAmountMinor, detailPayout.currency)}`}
                      valueClass="text-muted-foreground text-xs"
                    />
                  )}
                  <Separator />
                  <Row
                    label="Original Net Payout"
                    value={formatAmount(detailPayout.payoutAmountMinor, detailPayout.currency)}
                    valueClass={detailPayout.adminOverrideAmountMinor != null ? "line-through text-muted-foreground" : "font-bold text-green-600"}
                  />
                  {detailPayout.adminOverrideAmountMinor != null && (
                    <Row
                      label="Effective Payout (override)"
                      value={formatAmount(detailPayout.adminOverrideAmountMinor, detailPayout.currency)}
                      valueClass="font-bold text-amber-600"
                    />
                  )}
                </div>

                {/* ── Phase 5: Refund Info ──────────────────────────────── */}
                {detailPayout.refundIssued && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2 text-sm">
                    <p className="font-semibold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Refund Issued
                    </p>
                    <Row
                      label="Total Refunded"
                      value={formatAmount(detailPayout.refundAmountMinor, detailPayout.currency ?? "INR")}
                      valueClass="text-amber-700 font-medium"
                    />
                  </div>
                )}

                {/* ── Phase 5: Override Info ────────────────────────────── */}
                {detailPayout.adminOverrideAmountMinor != null && (
                  <div className="rounded-md border p-3 space-y-2 text-sm">
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Override Details</p>
                    <Row
                      label="Override Amount"
                      value={formatAmount(detailPayout.adminOverrideAmountMinor, detailPayout.currency)}
                      valueClass="font-medium text-amber-600"
                    />
                    {detailPayout.adminOverrideReason && (
                      <div>
                        <span className="text-muted-foreground text-xs">Reason</span>
                        <p className="text-xs mt-0.5">{detailPayout.adminOverrideReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Dates ─────────────────────────────────────────────── */}
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <Row label="Created At" value={formatDateTime(detailPayout.createdAt)} />
                  <Row label="Last Updated" value={formatDateTime(detailPayout.updatedAt)} />
                  {detailPayout.paidAt && (
                    <Row label="Paid At" value={formatDateTime(detailPayout.paidAt)} />
                  )}
                </div>

                {/* ── Admin Note ────────────────────────────────────────── */}
                {detailPayout.adminNote && (
                  <div className="rounded-md border p-3 text-sm">
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1">Admin Note</p>
                    <p className="text-sm">{detailPayout.adminNote}</p>
                  </div>
                )}

                {/* ── Audit Log ─────────────────────────────────────────── */}
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Audit Trail</p>
                  {auditLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading…
                    </div>
                  ) : auditLog && auditLog.length > 0 ? (
                    <div className="space-y-2">
                      {auditLog.map((entry) => (
                        <div key={entry.auditLogId} className="rounded border p-2 text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{actionLabel(entry.action)}</span>
                            <span className="text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {entry.previousStatus && (
                              <span>{entry.previousStatus} → </span>
                            )}
                            <span>{entry.newStatus}</span>
                          </div>
                          {entry.performedByUserId && (
                            <div className="text-muted-foreground">By: {entry.performedByUserId}</div>
                          )}
                          {entry.note && (
                            <div className="text-muted-foreground italic">{entry.note}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No audit entries yet.</p>
                  )}
                </div>

                {/* ── Quick Actions ─────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {detailPayout.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className={detailPayout.requiresReview
                          ? "border-amber-500 text-amber-700"
                          : ""}
                        onClick={() => { handleProcessClick(detailPayout); setDetailPayout(null) }}
                        disabled={processMutation.isPending}
                      >
                        {detailPayout.requiresReview && (
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Process
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                        onClick={() => { openHoldDialog(detailPayout.payoutId); setDetailPayout(null) }}
                      >
                        Hold
                      </Button>
                    </>
                  )}
                  {(detailPayout.status === "PENDING" || detailPayout.status === "ON_HOLD") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { openOverrideDialog(detailPayout); setDetailPayout(null) }}
                    >
                      Set Override Amount
                    </Button>
                  )}
                  {detailPayout.status === "PROCESSING" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => { openCompleteDialog(detailPayout.payoutId); setDetailPayout(null) }}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                        onClick={() => { openHoldDialog(detailPayout.payoutId); setDetailPayout(null) }}
                      >
                        Hold
                      </Button>
                    </>
                  )}
                  {detailPayout.status === "ON_HOLD" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-600"
                      onClick={() => { releaseMutation.mutate(detailPayout.payoutId); setDetailPayout(null) }}
                      disabled={releaseMutation.isPending}
                    >
                      Release Hold
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Complete Payout Dialog ────────────────────────────────────────── */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payout</DialogTitle>
            <DialogDescription>
              Enter the bank transaction reference to confirm this payout was transferred.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payout Reference *</Label>
              <Input
                placeholder="e.g., NEFT / IMPS / UPI transaction ID"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Note (optional)</Label>
              <Textarea
                placeholder="Internal notes…"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={!payoutReference.trim() || completeMutation.isPending}
              onClick={() =>
                completeMutation.mutate({
                  payoutId: selectedPayoutId,
                  payoutReference,
                  adminNote: adminNote || undefined,
                })
              }
            >
              {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Hold Payout Dialog ────────────────────────────────────────────── */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Payout On Hold</DialogTitle>
            <DialogDescription>
              The payout will be moved to ON_HOLD status. Provide an optional reason for the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="e.g., Awaiting mentor KYC verification…"
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHoldDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
              disabled={holdMutation.isPending}
              onClick={() =>
                holdMutation.mutate({
                  payoutId: holdPayoutId,
                  reason: holdReason || undefined,
                })
              }
            >
              {holdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place On Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Phase 5: Override Amount Dialog ──────────────────────────────── */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Payout Amount</DialogTitle>
            <DialogDescription>
              Set a custom payout amount for this payout. The override is used when the payout is
              completed. Gross amount:{" "}
              {overrideGross != null
                ? formatAmount(overrideGross, "INR")
                : "—"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Override Amount (minor units — e.g. paisa for INR) *</Label>
              <Input
                type="number"
                min={0}
                max={overrideGross ?? undefined}
                placeholder="e.g. 85000 for ₹850"
                value={overrideAmount}
                onChange={(e) => setOverrideAmount(e.target.value)}
              />
              {overrideAmount && !isNaN(Number(overrideAmount)) && (
                <p className="text-xs text-muted-foreground">
                  = {formatAmount(Number(overrideAmount), "INR")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="e.g. Partial refund of ₹50 issued — net adjusted accordingly"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !overrideAmount.trim() ||
                isNaN(Number(overrideAmount)) ||
                Number(overrideAmount) < 0 ||
                !overrideReason.trim() ||
                overrideMutation.isPending
              }
              onClick={() =>
                overrideMutation.mutate({
                  payoutId: overridePayoutId,
                  overrideAmountMinor: Number(overrideAmount),
                  reason: overrideReason,
                })
              }
            >
              {overrideMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Phase 5: Process Confirmation Dialog (requiresReview) ─────────── */}
      <Dialog open={processConfirmOpen} onOpenChange={setProcessConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm: Process Payout with Refund
            </DialogTitle>
            <DialogDescription>
              This payout has been flagged for review because a refund was issued against the
              linked payment order.
            </DialogDescription>
          </DialogHeader>
          {processConfirmPayout && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700">Refund on record</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>
                  Refunded:{" "}
                  <strong>
                    {formatAmount(processConfirmPayout.refundAmountMinor, processConfirmPayout.currency)}
                  </strong>
                </p>
                <p className="mt-1">
                  Effective payout:{" "}
                  <strong>
                    {processConfirmPayout.adminOverrideAmountMinor != null
                      ? formatAmount(processConfirmPayout.adminOverrideAmountMinor, processConfirmPayout.currency)
                      : formatAmount(processConfirmPayout.payoutAmountMinor, processConfirmPayout.currency)}
                  </strong>
                  {processConfirmPayout.adminOverrideAmountMinor != null && (
                    <span className="text-xs ml-1">(override applied)</span>
                  )}
                </p>
              </AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            Are you sure you want to proceed with processing this payout?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProcessConfirmOpen(false)
                setProcessConfirmPayout(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
              disabled={processMutation.isPending}
              onClick={() => {
                if (processConfirmPayout) {
                  processMutation.mutate(processConfirmPayout.payoutId)
                }
                setProcessConfirmOpen(false)
                setProcessConfirmPayout(null)
              }}
            >
              {processMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Process Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Small helper: detail row ─────────────────────────────────────────────────

function Row({
  label,
  value,
  mono = false,
  valueClass = "",
}: {
  label: string
  value: string
  mono?: boolean
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? "font-mono text-xs" : ""} ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}


