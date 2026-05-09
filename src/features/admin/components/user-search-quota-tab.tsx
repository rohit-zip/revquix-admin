/**
 * ─── USER SEARCH QUOTA TAB (ADMIN) ────────────────────────────────────────────
 *
 * Allows admins to view and manage a user's monthly people-search quota.
 *
 * Displays:
 *   • Current effective limit (unlimited / custom / default)
 *   • Month-by-month usage history table
 *   • Form to set a custom quota (-1 = unlimited, positive = custom cap)
 *   • Reset button to restore system default (10/month)
 *
 * Requires: PERM_MANAGE_SEARCH_QUOTA
 */

"use client"

import React, { useState } from "react"
import {
  Search,
  Infinity,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  useAdminSearchQuota,
  useResetAdminSearchQuota,
  useSetAdminSearchQuota,
} from "@/features/admin/api/admin-user.hooks"
import type { QuotaMonthEntry } from "@/features/admin/api/admin-user.types"

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_DEFAULT_QUOTA = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatYearMonth(yearMonth: string): string {
  // "2026-05" → "May 2026"
  const [year, month] = yearMonth.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function QuotaTypeBadge({ entry }: { entry: QuotaMonthEntry }) {
  if (entry.customQuota === -1) {
    return (
      <Badge variant="outline" className="gap-1 text-xs border-violet-500/50 text-violet-600 dark:text-violet-400">
        <Infinity className="size-3" />
        Unlimited
      </Badge>
    )
  }
  if (entry.customQuota !== null) {
    return (
      <Badge variant="outline" className="gap-1 text-xs border-blue-500/50 text-blue-600 dark:text-blue-400">
        <CheckCircle2 className="size-3" />
        Custom
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      System Default
    </Badge>
  )
}

function CurrentLimitBadge({
  currentLimit,
  isCurrentlyUnlimited,
}: {
  currentLimit: number
  isCurrentlyUnlimited: boolean
}) {
  if (isCurrentlyUnlimited) {
    return (
      <Badge className="gap-1 text-sm px-3 py-1 bg-violet-600 hover:bg-violet-600">
        <Infinity className="size-4" />
        Unlimited
      </Badge>
    )
  }
  if (currentLimit !== SYSTEM_DEFAULT_QUOTA) {
    return (
      <Badge className="gap-1 text-sm px-3 py-1 bg-blue-600 hover:bg-blue-600">
        <CheckCircle2 className="size-4" />
        {currentLimit} / month (custom)
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 text-sm px-3 py-1">
      {currentLimit} / month (default)
    </Badge>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserSearchQuotaTabProps {
  userId: string
}

// ─── Set Quota Form ───────────────────────────────────────────────────────────

function SetQuotaForm({ userId }: { userId: string }) {
  const [rawValue, setRawValue] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const { mutate, isPending } = useSetAdminSearchQuota(userId, () => {
    setRawValue("")
    setValidationError(null)
  })

  function validate(value: string): string | null {
    const n = Number(value)
    if (value.trim() === "" || isNaN(n) || !Number.isInteger(n)) {
      return "Enter an integer: -1 for unlimited, or a positive number for a custom cap."
    }
    if (n === 0) return "Zero is not allowed. Use -1 for unlimited or a positive number."
    if (n < -1) return "Minimum value is -1 (unlimited)."
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate(rawValue)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    mutate({ quota: Number(rawValue) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="quota-input">
          New quota value
        </Label>
        <p className="text-xs text-muted-foreground">
          Enter{" "}
          <code className="bg-muted px-1 rounded text-[11px]">-1</code>{" "}
          for unlimited, or a positive integer for a custom monthly cap.
          Use the reset button below to restore the system default (10/month).
        </p>
        <div className="flex gap-2">
          <Input
            id="quota-input"
            type="number"
            step="1"
            placeholder="-1 or positive integer"
            value={rawValue}
            onChange={(e) => {
              setRawValue(e.target.value)
              setValidationError(null)
            }}
            className="max-w-52"
            disabled={isPending}
            aria-describedby={validationError ? "quota-error" : undefined}
          />
          <Button type="submit" disabled={isPending || rawValue.trim() === ""}>
            {isPending ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Set Quota"
            )}
          </Button>
        </div>
        {validationError && (
          <p id="quota-error" className="text-xs text-destructive">
            {validationError}
          </p>
        )}
      </div>
    </form>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserSearchQuotaTab({ userId }: UserSearchQuotaTabProps) {
  const { data, isLoading, isError, refetch } = useAdminSearchQuota(userId)
  const { mutate: resetQuota, isPending: isResetting } = useResetAdminSearchQuota(userId)

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load quota data</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // No history yet — user hasn't searched this month
  if (!data) return null

  const currentEntry = data.history[0] ?? null
  const currentUsed = currentEntry?.searchCount ?? 0
  const progressMax = data.isCurrentlyUnlimited ? 100 : data.currentLimit
  const progressValue = data.isCurrentlyUnlimited
    ? 0
    : Math.min((currentUsed / Math.max(progressMax, 1)) * 100, 100)

  return (
    <div className="space-y-6">
      {/* ── Current Month Summary ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-5" />
                Search Quota
              </CardTitle>
              <CardDescription className="mt-1">
                Current monthly people-search limit and usage
              </CardDescription>
            </div>
            <CurrentLimitBadge
              currentLimit={data.currentLimit}
              isCurrentlyUnlimited={data.isCurrentlyUnlimited}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Usage progress */}
          {!data.isCurrentlyUnlimited && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used this month</span>
                <span className="font-medium tabular-nums">
                  {currentUsed} / {data.currentLimit}
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
              {currentUsed >= data.currentLimit && (
                <p className="text-xs text-destructive font-medium">
                  Quota exhausted — user cannot perform new searches this month
                </p>
              )}
            </div>
          )}

          {data.isCurrentlyUnlimited && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Infinity className="size-4 text-violet-500" />
              <span>
                This user has unlimited searches.{" "}
                <span className="font-medium text-foreground tabular-nums">{currentUsed}</span>{" "}
                used this month.
              </span>
            </div>
          )}

          <Separator />

          {/* Set quota form */}
          <SetQuotaForm userId={userId} />

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground"
              disabled={isResetting}
              onClick={() => resetQuota()}
            >
              {isResetting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Reset to Default (10/month)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => refetch()}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── History Table ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            Usage History
          </CardTitle>
          <CardDescription>
            Month-by-month search activity — {data.history.length} record
            {data.history.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Search className="size-8 opacity-30" />
              <p className="text-sm">No usage records yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Searches Used</TableHead>
                  <TableHead className="text-right">Effective Limit</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((entry) => (
                  <TableRow key={entry.yearMonth}>
                    <TableCell className="font-medium">
                      {formatYearMonth(entry.yearMonth)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.searchCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.customQuota === -1 ? (
                        <span className="text-violet-600 dark:text-violet-400 flex items-center justify-end gap-1">
                          <Infinity className="size-3" />
                          Unlimited
                        </span>
                      ) : (
                        entry.effectiveLimit
                      )}
                    </TableCell>
                    <TableCell>
                      <QuotaTypeBadge entry={entry} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
