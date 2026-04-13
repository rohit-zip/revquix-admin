/**
 * ─── MENTOR PAYOUT VIEW ──────────────────────────────────────────────────────
 *
 * Table view of mentor's payout history with status badges.
 */

"use client"

import React, { useState } from "react"
import { Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

import { useMyPayouts } from "./api/professional-mentor.hooks"
import type { PayoutStatus } from "./api/professional-mentor.types"

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

export default function MentorPayoutView() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useMyPayouts(page, 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payout History</h1>
        <p className="text-muted-foreground">Track your earnings and payout status.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Wallet className="mx-auto mb-2 h-8 w-8" />
                    No payouts yet. Complete mock interviews to start earning.
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((payout) => (
                  <TableRow key={payout.payoutId}>
                    <TableCell className="font-mono text-xs">{payout.payoutId}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(payout.payoutAmountMinor, payout.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.commissionPercentage}%
                    </TableCell>
                    <TableCell>{getPayoutBadge(payout.status)}</TableCell>
                    <TableCell>{formatDate(payout.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payout.payoutReference ?? "—"}
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
    </div>
  )
}

