/**
 * ─── PAYOUT REPORTS VIEW (Phase 8) ───────────────────────────────────────────
 *
 * Admin panel for payout reporting and data export.
 *
 * Features:
 *   • CSV export — download all (or filtered) payouts as a spreadsheet
 *   • Monthly summary tab — COMPLETED payout counts + amounts by month
 *   • Commission revenue tab — platform fee + GST by month
 *   • Mentor earnings tab — per-mentor breakdown sorted by total earned
 *
 * All reports support an optional date range filter (from / to on paidAt).
 */

"use client"

import { useState } from "react"
import {
  BarChart3,
  Download,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  useCommissionRevenue,
  useDownloadPayoutsCsv,
  useMentorEarningsBreakdown,
  useMonthlyPayoutSummary,
} from "@/features/professional-mentor/api/professional-mentor.hooks"
import type { PayoutStatus } from "@/features/professional-mentor/api/professional-mentor.types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/**
 * Formats a minor-unit amount in the currency it was actually aggregated in.
 *
 * Rows are grouped by currency server-side (payments-plan Part 9 item 9), so a hardcoded ₹ would
 * mislabel a USD row — the same defect the mentor wallet carried before the currency split.
 */
function formatAmount(minor: number, currency = "INR"): string {
  const symbol = currency === "USD" ? "$" : currency === "INR" ? "₹" : `${currency} `
  const locale = currency === "INR" ? "en-IN" : "en-US"
  return `${symbol}${(minor / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Totals a set of rows, refusing to add across currencies.
 *
 * Returns `null` when the rows span more than one currency — the caller renders "Mixed" rather than
 * a number that is not money in any currency. Deliberately not an FX conversion: inventing a rate
 * on a finance report would present a made-up figure as a fact.
 */
function totalOf<T extends { currency: string }>(rows: T[], pick: (row: T) => number): string {
  if (rows.length === 0) return formatAmount(0)
  const currency = rows[0].currency
  if (rows.some((r) => r.currency !== currency)) return "Mixed currencies"
  return formatAmount(rows.reduce((sum, r) => sum + pick(r), 0), currency)
}

// ─── Date-range controls ──────────────────────────────────────────────────────

interface DateRangeFilterProps {
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}

function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="report-from" className="text-xs text-muted-foreground">From</Label>
        <Input
          id="report-from"
          type="date"
          className="w-40 h-8 text-sm"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="report-to" className="text-xs text-muted-foreground">To</Label>
        <Input
          id="report-to"
          type="date"
          className="w-40 h-8 text-sm"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    </div>
  )
}

// ─── Utility: convert local date string → ISO-8601 instant string ─────────────

function toInstant(dateStr: string, endOfDay = false): string | undefined {
  if (!dateStr) return undefined
  return endOfDay ? `${dateStr}T23:59:59Z` : `${dateStr}T00:00:00Z`
}

// ─── Export CSV Panel ─────────────────────────────────────────────────────────

function ExportPanel() {
  const [exportFrom, setExportFrom] = useState("")
  const [exportTo, setExportTo] = useState("")
  const [exportStatus, setExportStatus] = useState<string>("ALL")
  const { mutate: download, isPending } = useDownloadPayoutsCsv()

  const handleDownload = () => {
    download({
      from: toInstant(exportFrom),
      to: toInstant(exportTo, true),
      status: exportStatus === "ALL" ? undefined : exportStatus,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-4 w-4" />
          Export Payouts
        </CardTitle>
        <CardDescription>
          Download payout records as a UTF-8 CSV file. Optionally filter by status and date range.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-6 items-end">
          <DateRangeFilter
            from={exportFrom}
            to={exportTo}
            onFromChange={setExportFrom}
            onToChange={setExportTo}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="export-status" className="text-xs text-muted-foreground">
              Status filter
            </Label>
            <Select value={exportStatus} onValueChange={setExportStatus}>
              <SelectTrigger id="export-status" className="w-40 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isPending ? "Preparing download…" : "Download CSV"}
        </Button>

        <p className="text-xs text-muted-foreground">
          The file includes: payout ID, mentor details, gross amount, platform fee, GST,
          net payout, status, payment reference, dates, and override/refund info.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Monthly Summary Panel ────────────────────────────────────────────────────

function MonthlySummaryPanel() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const { data = [], isLoading } = useMonthlyPayoutSummary(
    toInstant(from),
    toInstant(to, true),
  )

  // Counts add across currencies; money does not. totalOf refuses rather than inventing a rate.
  const totalCount = data.reduce((s, r) => s + r.completedCount, 0)
  const totalPayout = totalOf(data, (r) => r.totalPayoutMinor)
  const totalGross = totalOf(data, (r) => r.totalGrossMinor)
  const totalFee = totalOf(data, (r) => r.totalPlatformFeeMinor)

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      {/* Aggregate summary cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Completed payouts", value: totalCount.toLocaleString() },
            { label: "Total paid out (net)", value: totalPayout },
            { label: "Gross revenue", value: totalGross },
            { label: "Platform commission", value: totalFee },
          ].map((card) => (
            <Card key={card.label} className="py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-semibold mt-0.5">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Payouts</TableHead>
                <TableHead className="text-right">Net payout</TableHead>
                <TableHead className="text-right">Gross revenue</TableHead>
                <TableHead className="text-right">Platform fee</TableHead>
                <TableHead className="text-right">GST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No completed payouts found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={`${row.year}-${row.month}`}>
                    <TableCell className="font-medium">
                      {MONTH_NAMES[row.month]} {row.year}
                    </TableCell>
                    <TableCell className="text-right">{row.completedCount}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.totalPayoutMinor, row.currency)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.totalGrossMinor, row.currency)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.totalPlatformFeeMinor, row.currency)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.totalGstMinor, row.currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Commission Revenue Panel ─────────────────────────────────────────────────

function CommissionRevenuePanel() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const { data = [], isLoading } = useCommissionRevenue(
    toInstant(from),
    toInstant(to, true),
  )

  const totalRevenue = totalOf(data, (r) => r.totalRevenueMinor)
  const totalFee = totalOf(data, (r) => r.platformFeeMinor)
  const totalGst = totalOf(data, (r) => r.gstMinor)

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Total revenue (fee + GST)", value: totalRevenue },
            { label: "Platform commission", value: totalFee },
            { label: "GST collected", value: totalGst },
          ].map((card) => (
            <Card key={card.label} className="py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-semibold mt-0.5">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Platform fee</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Total revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No commission data found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={`${row.year}-${row.month}`}>
                    <TableCell className="font-medium">
                      {MONTH_NAMES[row.month]} {row.year}
                    </TableCell>
                    <TableCell className="text-right">{row.transactionCount}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.platformFeeMinor, row.currency)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.gstMinor, row.currency)}</TableCell>
                    <TableCell className="text-right font-medium">{formatAmount(row.totalRevenueMinor, row.currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Mentor Earnings Panel ────────────────────────────────────────────────────

function MentorEarningsPanel() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const { data = [], isLoading } = useMentorEarningsBreakdown(
    toInstant(from),
    toInstant(to, true),
  )

  return (
    <div className="space-y-4">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Net earned</TableHead>
                <TableHead className="text-right">Gross revenue</TableHead>
                <TableHead className="text-right">Commission withheld</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No mentor earnings data found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.mentorUserId}>
                    <TableCell>
                      <div className="font-medium text-sm">{row.mentorName || row.mentorUserId}</div>
                      <div className="text-xs text-muted-foreground">{row.mentorEmail}</div>
                    </TableCell>
                    <TableCell className="text-right">{row.completedPayouts}</TableCell>
                    <TableCell className="text-right font-medium">{formatAmount(row.totalPayoutMinor, row.currency)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.totalGrossMinor, row.currency)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.totalPlatformFeeMinor, row.currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function PayoutReportsView() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payout Reports</h1>
        <p className="text-muted-foreground mt-1">
          Export and analyse payout data. All monetary values are in minor currency units (paise for INR).
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="export">
        <TabsList className="mb-4">
          <TabsTrigger value="export" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Monthly Summary
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Commission Revenue
          </TabsTrigger>
          <TabsTrigger value="mentors" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Mentor Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <ExportPanel />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlySummaryPanel />
        </TabsContent>

        <TabsContent value="commission">
          <CommissionRevenuePanel />
        </TabsContent>

        <TabsContent value="mentors">
          <MentorEarningsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
