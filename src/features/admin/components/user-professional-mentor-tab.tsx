/**
 * ─── USER PROFESSIONAL MENTOR TAB ─────────────────────────────────────────────
 *
 * Shown on the admin user-detail page when the user has ROLE_PROFESSIONAL_MENTOR.
 *
 * Sections:
 *   1. Profile Summary  — headline, bio, company, role, experience, categories, skills
 *   2. Session Stats    — total sessions, avg rating, total reviews
 *   3. Payout & Commission — commission rate, wallet balances, link to wallet page
 *   4. Payout Accounts  — registered bank / UPI accounts with verify button
 */

"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Star,
  Tag,
  User,
  Video,
  Wallet,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { useMentorProfileByUserId } from "@/features/professional-mentor/api/professional-mentor.hooks"
import { useMentorWallet, usePayoutAccountsForMentor, useVerifyPayoutAccount } from "@/features/payment/api/payment.hooks"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0 w-40">{label}</span>
      <div className="text-sm font-medium text-right flex-1">{children}</div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserProfessionalMentorTabProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfessionalMentorTab({ userId }: UserProfessionalMentorTabProps) {
  const router = useRouter()

  const { data: profile, isLoading: profileLoading } = useMentorProfileByUserId(userId)
  const { data: wallet, isLoading: walletLoading } = useMentorWallet(userId)
  const { data: accounts, isLoading: accountsLoading } = usePayoutAccountsForMentor(userId)
  const { mutate: verifyAccount, isPending: verifying } = useVerifyPayoutAccount()

  // ── Loading ──────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // ── Not a mentor yet ─────────────────────────────────────────────────────
  if (!profile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <User className="size-10 text-muted-foreground mb-3" />
          <p className="font-medium">No mentor profile found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This user has not created a professional mentor profile yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Profile Summary ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 divide-y divide-border">
          <DetailRow label="Headline">{profile.headline || "—"}</DetailRow>
          <DetailRow label="Company">
            <span className="flex items-center gap-1.5 justify-end">
              <Building2 className="size-3.5 text-muted-foreground" />
              {profile.currentCompany || "—"}
            </span>
          </DetailRow>
          <DetailRow label="Role">{profile.currentRole || "—"}</DetailRow>
          <DetailRow label="Experience">{profile.yearsOfExperience != null ? `${profile.yearsOfExperience} yrs` : "—"}</DetailRow>
          <DetailRow label="Bio">
            <span className="text-left block text-muted-foreground">{profile.bio || "—"}</span>
          </DetailRow>
          <DetailRow label="Status">
            <div className="flex gap-1.5 flex-wrap justify-end">
              <Badge variant={profile.isActive ? "default" : "secondary"} className="text-xs">
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={profile.isAcceptingBookings ? "default" : "secondary"} className="text-xs">
                {profile.isAcceptingBookings ? "Accepting Bookings" : "Not Accepting"}
              </Badge>
            </div>
          </DetailRow>
          <DetailRow label="Services">
            <div className="flex gap-1.5 flex-wrap justify-end">
              <Badge variant={profile.isAcceptingMockInterviews ? "outline" : "secondary"} className="text-xs">
                <Video className="size-3 mr-1" />
                Mock {profile.isAcceptingMockInterviews ? "On" : "Off"}
              </Badge>
              <Badge variant={profile.isAcceptingHourlySessions ? "outline" : "secondary"} className="text-xs">
                <Briefcase className="size-3 mr-1" />
                Hourly {profile.isAcceptingHourlySessions ? "On" : "Off"}
              </Badge>
            </div>
          </DetailRow>
          {profile.categories.length > 0 && (
            <DetailRow label="Categories">
              <div className="flex flex-wrap gap-1 justify-end">
                {profile.categories.map((c) => (
                  <Badge key={c.categoryId} variant="secondary" className="text-xs">
                    <Tag className="size-3 mr-1" />
                    {c.name}
                  </Badge>
                ))}
              </div>
            </DetailRow>
          )}
          {profile.skills.length > 0 && (
            <DetailRow label="Skills">
              <div className="flex flex-wrap gap-1 justify-end">
                {profile.skills.map((s) => (
                  <Badge key={s.skillId} variant="outline" className="text-xs">{s.name}</Badge>
                ))}
              </div>
            </DetailRow>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Session Stats ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-4" />
            Session Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Sessions" value={profile.totalSessions} />
            <StatCard label="Avg Rating" value={profile.averageRating > 0 ? profile.averageRating.toFixed(1) : "—"} />
            <StatCard label="Total Reviews" value={profile.totalReviews} />
            <StatCard label="Mock INR Price" value={profile.priceInrPaise != null ? formatInr(profile.priceInrPaise) : "—"} />
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Payout & Commission ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="size-4" />
            Payout & Commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : wallet ? (
            <div className="space-y-1 divide-y divide-border">
              <DetailRow label="Commission Rate">
                {wallet.customCommissionPercentage != null
                  ? `${wallet.customCommissionPercentage}% (custom)`
                  : "Platform default"}
              </DetailRow>
              <DetailRow label="Pending Balance">
                {formatInr(wallet.pendingPayoutMinor + wallet.processingPayoutMinor)}
              </DetailRow>
              <DetailRow label="On Hold">{formatInr(wallet.onHoldPayoutMinor)}</DetailRow>
              <DetailRow label="Total Paid Out">{formatInr(wallet.totalPaidOutMinor)}</DetailRow>
              <DetailRow label="Total Earnings">{formatInr(wallet.totalEarningsMinor)}</DetailRow>
              <div className="pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => router.push(`/wallets/${userId}`)}
                >
                  <ExternalLink className="size-3.5" />
                  View Full Wallet
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No wallet found for this mentor.</p>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Payout Accounts ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="size-4" />
            Payout Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.payoutAccountId}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {account.accountType === "UPI" ? account.upiId : account.displayName || account.bankName || "Bank Account"}
                      </span>
                      {account.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                      {account.isVerified ? (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/50 gap-1">
                          <CheckCircle2 className="size-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <XCircle className="size-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    {account.accountType === "BANK_ACCOUNT" && (
                      <p className="text-xs text-muted-foreground">
                        {account.bankName} · ****{account.maskedAccountNumber} · {account.ifscCode}
                      </p>
                    )}
                    {account.accountType === "UPI" && (
                      <p className="text-xs text-muted-foreground">UPI ID: {account.upiId}</p>
                    )}
                  </div>
                  {!account.isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={verifying}
                      onClick={() => verifyAccount(account.payoutAccountId)}
                    >
                      <ShieldCheck className="size-3.5" />
                      Verify
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payout accounts registered.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  )
}
