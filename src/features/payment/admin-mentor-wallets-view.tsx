/**
 * ─── ADMIN MENTOR WALLETS VIEW ──────────────────────────────────────────────
 *
 * Admin dashboard for viewing all professional mentors' wallet summaries.
 * Shows interviews conducted, current balance, total earnings, pending payouts.
 * Uses server-side pagination (20 per page) via POST /wallets/admin/search.
 *
 * Route: /admin/wallets
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  Clock,
  Search,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useMentorWalletsPaginated } from "@/features/payment/api/payment.hooks"
import type { MentorWalletSummaryResponse } from "@/features/payment/api/payment.types"

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

const PAGE_SIZE = 20

export default function AdminMentorWalletsView() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const { data, isLoading } = useMentorWalletsPaginated(page, PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState("")

  const wallets = data?.content ?? []

  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return wallets
    const q = searchQuery.toLowerCase()
    return wallets.filter(
      (w) =>
        w.mentorName.toLowerCase().includes(q) ||
        w.mentorEmail.toLowerCase().includes(q) ||
        w.mentorUserId.toLowerCase().includes(q),
    )
  }, [wallets, searchQuery])

  // Aggregate stats for current page
  const totalPending = wallets.reduce((s, w) => s + w.pendingPayoutMinor, 0)
  const totalEarnings = wallets.reduce((s, w) => s + w.totalEarningsMinor, 0)
  const totalInterviews = wallets.reduce((s, w) => s + w.totalInterviewsConducted, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentor Wallets</h1>
        <p className="text-muted-foreground">
          Overview of all professional mentor earnings, balances, and payouts.
        </p>
      </div>

      {/* ── Aggregate Summary Cards (current page) ── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Mentors</p>
              <p className="text-2xl font-bold">{data?.totalElements ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Earnings</p>
              <p className="text-2xl font-bold">{formatAmount(totalEarnings, "INR")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Pending</p>
              <p className="text-2xl font-bold">{formatAmount(totalPending, "INR")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Interviews</p>
              <p className="text-2xl font-bold">{totalInterviews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search (client-side filter on current page) ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search mentor name, email, or ID..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Wallets Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Interviews</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !filtered.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Wallet className="mx-auto mb-2 h-8 w-8" />
                    No mentor wallets found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((wallet) => (
                  <WalletRow
                    key={wallet.mentorUserId}
                    wallet={wallet}
                    onClick={() => router.push(`/admin/wallets/${wallet.mentorUserId}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {/* ── Pagination ── */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t p-4">
              <Button
                variant="outline"
                size="sm"
                disabled={data.first}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.number + 1} of {data.totalPages}
                {" "}· {data.totalElements} mentors
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WalletRow({
  wallet,
  onClick,
}: {
  wallet: MentorWalletSummaryResponse
  onClick: () => void
}) {
  const currency = wallet.currency || "INR"
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{wallet.mentorName}</p>
          <p className="text-xs text-muted-foreground">{wallet.mentorEmail}</p>
        </div>
      </TableCell>
      <TableCell className="font-medium">{wallet.totalInterviewsConducted}</TableCell>
      <TableCell>
        <span className="font-semibold text-green-600">
          {formatAmount(wallet.currentBalanceMinor, currency)}
        </span>
      </TableCell>
      <TableCell>
        {wallet.pendingPayoutMinor > 0 ? (
          <span className="text-amber-600">{formatAmount(wallet.pendingPayoutMinor, currency)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{formatAmount(wallet.totalPaidOutMinor, currency)}</TableCell>
      <TableCell>{formatAmount(wallet.totalEarningsMinor, currency)}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {wallet.customCommissionPercentage != null
            ? `${wallet.customCommissionPercentage}% (custom)`
            : "Default"}
        </Badge>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" className="h-7" onClick={(e) => { e.stopPropagation(); onClick() }}>
          View
        </Button>
      </TableCell>
    </TableRow>
  )
}
