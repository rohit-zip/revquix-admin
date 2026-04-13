/**
 * ─── ADMIN MENTOR WALLET DETAIL VIEW ─────────────────────────────────────────
 *
 * Detail page for a single mentor's wallet.
 * Shows summary cards, commission config, and payout history.
 *
 * Route: /admin/wallets/[mentorUserId]
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowLeft,
  Banknote,
  IndianRupee,
  Loader2,
  Percent,
  TrendingUp,
  Video,
  Wallet,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  useMentorWallet,
  useUpdateMentorCommission,
} from "@/features/payment/api/payment.hooks"

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

interface AdminMentorWalletDetailViewProps {
  mentorUserId: string
}

export default function AdminMentorWalletDetailView({ mentorUserId }: AdminMentorWalletDetailViewProps) {
  const router = useRouter()
  const { data: wallet, isLoading, refetch } = useMentorWallet(mentorUserId)
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [commissionInput, setCommissionInput] = useState("")

  const commissionMutation = useUpdateMentorCommission(() => {
    setCommissionDialogOpen(false)
    refetch()
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/admin/wallets")}>
          <ArrowLeft className="h-4 w-4" /> Back to Wallets
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive/50 mb-4" />
            <h2 className="text-lg font-semibold">Wallet Not Found</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currency = wallet.currency || "INR"

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/admin/wallets")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{wallet.mentorName}</h1>
            <p className="text-sm text-muted-foreground">{wallet.mentorEmail}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {wallet.mentorUserId}
              {wallet.mentorProfileId && ` · ${wallet.mentorProfileId}`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setCommissionInput(wallet.customCommissionPercentage?.toString() ?? "")
            setCommissionDialogOpen(true)
          }}
        >
          <Percent className="h-4 w-4" />
          {wallet.customCommissionPercentage != null
            ? `Commission: ${wallet.customCommissionPercentage}%`
            : "Set Commission"}
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(wallet.currentBalanceMinor, currency)}
              </p>
              <p className="text-xs text-muted-foreground">Not yet transferred</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">{formatAmount(wallet.totalEarningsMinor, currency)}</p>
              <p className="text-xs text-muted-foreground">Lifetime earnings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Banknote className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid Out</p>
              <p className="text-2xl font-bold">{formatAmount(wallet.totalPaidOutMinor, currency)}</p>
              <p className="text-xs text-muted-foreground">Transferred to bank</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Video className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interviews</p>
              <p className="text-2xl font-bold">{wallet.totalInterviewsConducted}</p>
              <p className="text-xs text-muted-foreground">{wallet.totalPayoutRecords} payout records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Breakdown Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IndianRupee className="h-4 w-4" /> Balance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <DetailRow label="Pending Payouts" value={formatAmount(wallet.pendingPayoutMinor, currency)} highlight={wallet.pendingPayoutMinor > 0 ? "amber" : undefined} />
          <Separator />
          <DetailRow label="Processing Payouts" value={formatAmount(wallet.processingPayoutMinor, currency)} highlight={wallet.processingPayoutMinor > 0 ? "blue" : undefined} />
          <Separator />
          <DetailRow label="On Hold" value={formatAmount(wallet.onHoldPayoutMinor, currency)} highlight={wallet.onHoldPayoutMinor > 0 ? "red" : undefined} />
          <Separator />
          <DetailRow label="Completed Payouts" value={formatAmount(wallet.totalPaidOutMinor, currency)} highlight="green" />
          <Separator />
          <DetailRow
            label="Commission Rate"
            value={
              wallet.customCommissionPercentage != null
                ? `${wallet.customCommissionPercentage}% (custom)`
                : "System default"
            }
          />
        </CardContent>
      </Card>

      {/* ── Commission Dialog ── */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Commission Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a custom commission percentage for <strong>{wallet.mentorName}</strong>.
              Leave empty to use the system default. The platform deducts this percentage
              from each payment before crediting the mentor.
            </p>
            <div className="space-y-2">
              <Label>Commission Percentage (0–100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="e.g., 20 (leave empty for default)"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={commissionMutation.isPending}
              onClick={() => {
                const pct = commissionInput.trim() === "" ? null : parseInt(commissionInput, 10)
                if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) return
                commissionMutation.mutate({
                  mentorProfileId: wallet.mentorProfileId!,
                  commissionPercentage: pct,
                })
              }}
            >
              {commissionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: "amber" | "blue" | "red" | "green"
}) {
  const colorMap = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-green-600",
  }
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${highlight ? colorMap[highlight] : ""}`}>
        {value}
      </span>
    </div>
  )
}




