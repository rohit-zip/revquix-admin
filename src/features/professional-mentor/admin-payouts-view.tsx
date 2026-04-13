/**
 * ─── ADMIN PAYOUTS VIEW ──────────────────────────────────────────────────────
 *
 * Admin panel for managing mentor payouts with process/complete actions.
 */

"use client"

import React, { useState } from "react"
import { Loader2, Wallet } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

import {
  useMyPayouts,
  useProcessPayout,
  useCompletePayout,
} from "@/features/professional-mentor/api/professional-mentor.hooks"
import type { PayoutStatus } from "@/features/professional-mentor/api/professional-mentor.types"

function getPayoutBadge(status: PayoutStatus) {
  switch (status) {
    case "PENDING": return <Badge variant="secondary">Pending</Badge>
    case "PROCESSING": return <Badge className="bg-blue-600">Processing</Badge>
    case "COMPLETED": return <Badge className="bg-green-600">Completed</Badge>
    case "FAILED": return <Badge variant="destructive">Failed</Badge>
    case "ON_HOLD": return <Badge variant="outline">On Hold</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

export default function AdminPayoutsView() {
  const [page, setPage] = useState(0)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedPayoutId, setSelectedPayoutId] = useState("")
  const [payoutReference, setPayoutReference] = useState("")
  const [adminNote, setAdminNote] = useState("")

  // We reuse getMyPayouts for admin since the admin endpoint returns all payouts
  // In production, this would use a dedicated admin search endpoint
  const { data, isLoading, refetch } = useMyPayouts(page, 20)
  const processMutation = useProcessPayout(() => refetch())
  const completeMutation = useCompletePayout(() => {
    setCompleteDialogOpen(false)
    setPayoutReference("")
    setAdminNote("")
    refetch()
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground">Process and manage mentor payouts.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Net Payout</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.content.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Wallet className="mx-auto mb-2 h-8 w-8" />
                    No payouts found.
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((payout) => (
                  <TableRow key={payout.payoutId}>
                    <TableCell className="font-mono text-xs">{payout.payoutId}</TableCell>
                    <TableCell className="text-xs">{payout.mentorUserId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payout.grossAmountMinor != null
                        ? formatAmount(payout.grossAmountMinor, payout.currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payout.platformFeeMinor != null
                        ? formatAmount(payout.platformFeeMinor, payout.currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(payout.payoutAmountMinor, payout.currency)}
                    </TableCell>
                    <TableCell>{payout.commissionPercentage}%</TableCell>
                    <TableCell>{getPayoutBadge(payout.status)}</TableCell>
                    <TableCell>{formatDate(payout.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {payout.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => processMutation.mutate(payout.payoutId)}
                            disabled={processMutation.isPending}
                          >
                            {processMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Process"
                            )}
                          </Button>
                        )}
                        {payout.status === "PROCESSING" && (
                          <Button
                            size="sm"
                            className="h-7 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedPayoutId(payout.payoutId)
                              setPayoutReference("")
                              setAdminNote("")
                              setCompleteDialogOpen(true)
                            }}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={data.first} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.number + 1} of {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Complete Payout Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payout Reference *</Label>
              <Input
                placeholder="e.g., bank transaction ID"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Note (optional)</Label>
              <Textarea
                placeholder="Internal notes..."
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
    </div>
  )
}

