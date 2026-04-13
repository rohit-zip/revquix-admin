/**
 * ─── ADMIN MENTOR WALLETS VIEW ──────────────────────────────────────────────
 *
 * Admin dashboard for viewing all professional mentors' wallet summaries.
 * Shows interviews conducted, current balance, total earnings, pending payouts.
 *
 * Route: /admin/wallets
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowUpDown,
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

import { useAllMentorWallets } from "@/features/payment/api/payment.hooks"
import type { MentorWalletSummaryResponse } from "@/features/payment/api/payment.types"

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

export default function AdminMentorWalletsView() {
  const router = useRouter()
  const { data: wallets, isLoading } = useAllMentorWallets()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("currentBalanceMinor")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filtered = React.useMemo(() => {
    if (!wallets) return []
    const result = wallets.filter(
      (w) =>
        w.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.mentorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.mentorUserId.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] as number ?? 0
      const bVal = (b as unknown as Record<string, unknown>)[sortField] as number ?? 0
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })
    return result
  }, [wallets, searchQuery, sortField, sortDir])

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  // Aggregate stats
  const totalPending = wallets?.reduce((s, w) => s + w.pendingPayoutMinor, 0) ?? 0
  const totalEarnings = wallets?.reduce((s, w) => s + w.totalEarningsMinor, 0) ?? 0
  const totalInterviews = wallets?.reduce((s, w) => s + w.totalInterviewsConducted, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentor Wallets</h1>
        <p className="text-muted-foreground">
          Overview of all professional mentor earnings, balances, and payouts.
        </p>
      </div>

      {/* ── Aggregate Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Mentors</p>
              <p className="text-2xl font-bold">{wallets?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
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
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
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
              <p className="text-sm text-muted-foreground">Total Interviews</p>
              <p className="text-2xl font-bold">{totalInterviews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search ── */}
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
                <TableHead className="cursor-pointer" onClick={() => toggleSort("totalInterviewsConducted")}>
                  <span className="flex items-center gap-1">Interviews <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("currentBalanceMinor")}>
                  <span className="flex items-center gap-1">Current Balance <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("pendingPayoutMinor")}>
                  <span className="flex items-center gap-1">Pending <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("totalPaidOutMinor")}>
                  <span className="flex items-center gap-1">Total Paid <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("totalEarningsMinor")}>
                  <span className="flex items-center gap-1">Total Earnings <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
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




