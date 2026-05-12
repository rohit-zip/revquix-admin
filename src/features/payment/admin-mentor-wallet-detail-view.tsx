/**
 * ─── ADMIN MENTOR WALLET DETAIL VIEW ─────────────────────────────────────────
 *
 * Detail page for a single mentor's wallet.
 * Shows summary cards, commission config, and payout history.
 *
 * Route: /wallets/[mentorUserId]
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowLeft,
  Banknote,
  BadgeCheck,
  Building2,
  CircleCheck,
  Clock,
  Eye,
  IndianRupee,
  Loader2,
  Percent,
  Smartphone,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  usePayoutAccountsForMentor,
  useVerifyPayoutAccount,
  useAdminPayoutAccountFullDetails,
} from "@/features/payment/api/payment.hooks"
import { useMentorPayouts } from "@/features/professional-mentor/api/professional-mentor.hooks"
import type { AdminPayoutAccountDetailResponse, PayoutAccountResponse } from "@/features/payment/api/payment.types"
import type { MentorPayoutResponse } from "@/features/professional-mentor/api/professional-mentor.types"

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface AdminMentorWalletDetailViewProps {
  mentorUserId: string
}

export default function AdminMentorWalletDetailView({ mentorUserId }: AdminMentorWalletDetailViewProps) {
  const router = useRouter()
  const { data: wallet, isLoading, refetch } = useMentorWallet(mentorUserId)
  const { data: accounts, isLoading: accountsLoading } = usePayoutAccountsForMentor(mentorUserId)
  const [payoutPage, setPayoutPage] = useState(0)
  const { data: payoutsData, isLoading: payoutsLoading } = useMentorPayouts(mentorUserId, payoutPage)
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [commissionInput, setCommissionInput] = useState("")

  const verifyMutation = useVerifyPayoutAccount()

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
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/wallets")}>
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
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/wallets")}>
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

      {/* ── Payout Accounts ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Registered Payout Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : !accounts?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payout accounts registered yet.
            </p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <PayoutAccountCard
                  key={account.payoutAccountId}
                  account={account}
                  onVerify={() => verifyMutation.mutate(account.payoutAccountId)}
                  verifying={verifyMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Payout History ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Payout History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !payoutsData?.content.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground text-sm">
                    No payouts found.
                  </TableCell>
                </TableRow>
              ) : (
                payoutsData.content.map((payout) => (
                  <PayoutRow key={payout.payoutId} payout={payout} currency={currency} />
                ))
              )}
            </TableBody>
          </Table>
          {payoutsData && payoutsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-4">
              <Button variant="outline" size="sm" disabled={payoutsData.first} onClick={() => setPayoutPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {payoutsData.number + 1} of {payoutsData.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={payoutsData.last} onClick={() => setPayoutPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
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

function PayoutAccountCard({
  account,
  onVerify,
  verifying,
}: {
  account: PayoutAccountResponse
  onVerify: () => void
  verifying: boolean
}) {
  const isBank = account.accountType === "BANK_ACCOUNT"
  const [detailOpen, setDetailOpen] = useState(false)
  const [fullDetails, setFullDetails] = useState<AdminPayoutAccountDetailResponse | null>(null)
  const fullDetailsMutation = useAdminPayoutAccountFullDetails()

  function handleReveal() {
    if (fullDetails) {
      setDetailOpen(true)
      return
    }
    fullDetailsMutation.mutate(account.payoutAccountId, {
      onSuccess: (data) => {
        setFullDetails(data)
        setDetailOpen(true)
      },
    })
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            {isBank ? (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {account.displayName ?? (isBank ? "Bank Account" : "UPI")}
              </p>
              {account.isPrimary && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">Primary</Badge>
              )}
              {account.isVerified && (
                <CircleCheck className="h-3.5 w-3.5 text-green-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isBank
                ? `${account.bankName ?? ""} · ${account.maskedAccountNumber ?? "—"} · ${account.ifscCode ?? "—"}`
                : account.upiId ?? "—"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBank && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={fullDetailsMutation.isPending}
              onClick={handleReveal}
            >
              {fullDetailsMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              Full Details
            </Button>
          )}
          {!account.isVerified && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={verifying}
              onClick={onVerify}
            >
              {verifying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <BadgeCheck className="h-3.5 w-3.5" />
              )}
              Verify
            </Button>
          )}
        </div>
      </div>

      {/* Full Account Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Full Bank Account Details
            </DialogTitle>
          </DialogHeader>
          {fullDetails && (
            <div className="space-y-3 text-sm">
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
                This information is confidential. Use only for processing fund transfers.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Account Holder</p>
                  <p className="font-medium">{fullDetails.accountHolderName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{fullDetails.bankName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">{fullDetails.accountNumber ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IFSC Code</p>
                  <p className="font-mono font-medium">{fullDetails.ifscCode ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Type</p>
                  <p className="font-medium">{fullDetails.bankAccountType ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{fullDetails.isVerified ? "Verified ✓" : "Unverified"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function getPayoutStatusBadge(status: string) {
  switch (status) {
    case "PENDING": return <Badge variant="secondary">Pending</Badge>
    case "PROCESSING": return <Badge className="bg-blue-600 text-white">Processing</Badge>
    case "COMPLETED": return <Badge className="bg-green-600 text-white">Completed</Badge>
    case "FAILED": return <Badge variant="destructive">Failed</Badge>
    case "ON_HOLD": return <Badge variant="outline">On Hold</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function PayoutRow({ payout, currency }: { payout: MentorPayoutResponse; currency: string }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{payout.payoutId}</TableCell>
      <TableCell className="font-medium">
        {formatAmount(payout.payoutAmountMinor, currency)}
      </TableCell>
      <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
      <TableCell className="text-sm">{formatDate(payout.createdAt)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {payout.payoutReference ?? "—"}
      </TableCell>
    </TableRow>
  )
}
