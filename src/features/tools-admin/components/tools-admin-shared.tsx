/**
 * ─── TOOLS ADMIN SHARED PRIMITIVES (PHASE 8) ─────────────────────────────────
 *
 * Built once here rather than per screen, for the same reason P2 built its score dial once: eight
 * screens rendering the same credit delta, the same reason field and the same "this panel is empty
 * because another phase owns it" state would drift, and the one that drifts is the one nobody notices
 * is wrong.
 *
 * ⚠ MOTION: no `framer-motion` anywhere in this feature. The cross-phase standard (§ "Cross-phase
 * engineering standards", rule 2) permits it only for shared-element layout animation CSS cannot
 * express, and nothing here qualifies — these are enter fades, hover states and in-view reveals. They
 * use CSS transitions plus the existing `useInView` IntersectionObserver hook and the `fade-up-in`
 * keyframe already in `globals.css`. `globals.css` also carries a global
 * `prefers-reduced-motion: reduce` reset, so rule 3 is satisfied for free.
 */

"use client"

import React from "react"
import { AlertCircle, ArrowDown, ArrowUp, Info, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import {
  type AdminAdjustmentReasonCode,
  type AdminAuditOutcome,
  type CreditEntryType,
  type ToolRunStatus,
  minimumReasonLength,
} from "../api/tools-admin.types"

// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * Paise → rupees.
 *
 * Costs are held as integer paise all the way from the backend's integer micro-USD, so the only
 * floating-point operation in the whole chain is this one division for display. That is deliberate:
 * the daily spend ceiling sums micro-USD on every run and integer addition cannot drift.
 */
export function formatPaise(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "—"
  if (paise === 0) return "₹0"
  if (paise < 100) return `₹${(paise / 100).toFixed(2)}`
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return value.toLocaleString("en-IN")
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return `${value.toFixed(1)}%`
}

/**
 * Shortens a 64-character hash for display, keeping enough to compare two rows by eye.
 *
 * Never used where the value is passed back as a filter — the pivot needs the whole hash, and
 * truncating server-side would have broken it.
 */
export function shortHash(hash: string | null | undefined, chars = 10): string {
  if (!hash) return "—"
  return hash.length <= chars ? hash : `${hash.slice(0, chars)}…`
}

// ─── Badges ──────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const ENTRY_TYPE_BADGE: Record<CreditEntryType, { variant: BadgeVariant; label: string }> = {
  SIGNUP_GRANT: { variant: "default", label: "Signup grant" },
  GRANT: { variant: "default", label: "Grant" },
  EARN: { variant: "default", label: "Earn" },
  PURCHASE: { variant: "default", label: "Purchase" },
  HOLD: { variant: "secondary", label: "Hold" },
  DEBIT_COMMIT: { variant: "outline", label: "Run charged" },
  HOLD_RELEASE: { variant: "secondary", label: "Hold released" },
  REFUND: { variant: "default", label: "Refund" },
  ADMIN_ADJUST: { variant: "destructive", label: "Admin adjust" },
  EXPIRY: { variant: "destructive", label: "Expiry" },
  REVOKE: { variant: "destructive", label: "Revoke" },
}

export function EntryTypeBadge({ type }: { type: CreditEntryType }) {
  const info = ENTRY_TYPE_BADGE[type] ?? { variant: "outline" as BadgeVariant, label: type }
  return (
    <Badge variant={info.variant} className="text-xs whitespace-nowrap">
      {info.label}
    </Badge>
  )
}

const RUN_STATUS_BADGE: Record<ToolRunStatus, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: "secondary", label: "Pending" },
  RUNNING: { variant: "secondary", label: "Running" },
  SUCCEEDED: { variant: "default", label: "Succeeded" },
  FAILED: { variant: "destructive", label: "Failed" },
  TIMED_OUT: { variant: "destructive", label: "Timed out" },
  REJECTED: { variant: "destructive", label: "Rejected" },
}

export function RunStatusBadge({ status }: { status: ToolRunStatus }) {
  const info = RUN_STATUS_BADGE[status] ?? { variant: "outline" as BadgeVariant, label: status }
  return (
    <Badge variant={info.variant} className="text-xs whitespace-nowrap">
      {info.label}
    </Badge>
  )
}

const OUTCOME_BADGE: Record<AdminAuditOutcome, { variant: BadgeVariant; label: string }> = {
  APPLIED: { variant: "default", label: "Applied" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  REPLAYED: { variant: "outline", label: "Replayed" },
  PENDING_APPROVAL: { variant: "secondary", label: "Awaiting approval" },
}

export function OutcomeBadge({ outcome }: { outcome: AdminAuditOutcome }) {
  const info = OUTCOME_BADGE[outcome] ?? { variant: "outline" as BadgeVariant, label: outcome }
  return (
    <Badge variant={info.variant} className="text-xs whitespace-nowrap">
      {info.label}
    </Badge>
  )
}

/**
 * A signed credit movement.
 *
 * Zero is rendered as an explicit "0 (run charged)" rather than as a dash, because a `DEBIT_COMMIT`
 * carrying `delta = 0` is the single most likely thing for a reader to mistake for missing data — the
 * value was already removed by the hold, and the commit row exists to close it.
 */
export function CreditDelta({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined) {
    return <span className="text-muted-foreground">—</span>
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden="true" />
        <span>0</span>
        <span className="sr-only">zero — this row closes a hold rather than moving credits</span>
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      )}
    >
      {positive ? (
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
      )}
      {/* The sign is carried by the number as well as the arrow: no result may rely on colour or an
          icon alone, which is the same accessibility rule P2 applied to its score bands. */}
      {positive ? `+${delta}` : delta}
    </span>
  )
}

// ─── Layout primitives ───────────────────────────────────────────────────────

export function ScreenHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * A single figure with a label.
 *
 * Reveals on scroll with `useInView` plus the `fade-up-in` keyframe already in `globals.css` — an
 * IntersectionObserver and one GPU-composited keyframe, which is exactly what the cross-phase standard
 * prescribes instead of `framer-motion`'s `whileInView`.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: "default" | "positive" | "warning" | "danger"
  className?: string
}) {
  const { ref, inView } = useInView("-40px")

  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-red-600 dark:text-red-400"
          : ""

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card p-4 transition-shadow duration-200 hover:shadow-sm",
        inView && "animate-fade-up-in",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/**
 * A panel that exists but has nothing in it yet because another phase owns the data.
 *
 * §8.5 and §8.8 both ship deliberately partial surfaces, and this is how they say so. An explained
 * empty state is strictly better than an absent screen: the next operator learns the surface exists
 * and what unblocks it, and the owning phase lights it up without touching the UI.
 */
export function PendingPhasePanel({
  title,
  phase,
  reason,
}: {
  title: string
  phase?: string
  reason: string
}) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {title}
          {phase && (
            <Badge variant="outline" className="text-xs">
              owned by {phase}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{reason}</p>
      </CardContent>
    </Card>
  )
}

/** A short, always-visible explanation of a constraint the reader would otherwise misread. */
export function ConstraintNote({
  children,
  tone = "info",
}: {
  children: React.ReactNode
  tone?: "info" | "warning"
}) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-md border p-3 text-xs leading-relaxed",
        tone === "warning"
          ? "border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {tone === "warning" ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <div>{children}</div>
    </div>
  )
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ─── The reason field ────────────────────────────────────────────────────────

export const REASON_CODES: { value: AdminAdjustmentReasonCode; label: string }[] = [
  { value: "SUPPORT_GOODWILL", label: "Support goodwill" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "MIGRATION", label: "Migration / correction" },
  { value: "PARTNER", label: "Partner / campus" },
  { value: "FRAUD", label: "Fraud / chargeback" },
  { value: "PAYMENT_REFUND", label: "Payment refund" },
  { value: "INTERNAL_TESTING", label: "Internal / testing" },
  { value: "OTHER", label: "Other" },
]

export interface ReasonState {
  code: AdminAdjustmentReasonCode | ""
  text: string
}

export function isReasonValid(state: ReasonState): boolean {
  if (!state.code) return false
  return state.text.trim().length >= minimumReasonLength(state.code)
}

/**
 * The mandatory reason, used by every write in this feature.
 *
 * The client-side length check exists to be helpful, **not** to be the control: §8.9 criterion 1
 * requires the *API* to reject a reasonless adjustment, and it does, and so does
 * `ck_acaa_reason_len` at the database. Three statements of one rule is normally a smell; here the
 * outer one is UX and the inner two are the guarantee.
 *
 * `OTHER` demands a longer sentence because the code carries no meaning on its own — the counter
 * updates its target when the code changes rather than silently accepting a now-too-short reason.
 */
export function ReasonField({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: ReasonState
  onChange: (next: ReasonState) => void
  disabled?: boolean
  idPrefix: string
}) {
  const required = value.code ? minimumReasonLength(value.code) : minimumReasonLength("")
  const length = value.text.trim().length
  const tooShort = length > 0 && length < required
  const codeId = `${idPrefix}-reason-code`
  const textId = `${idPrefix}-reason-text`
  const helpId = `${idPrefix}-reason-help`

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={codeId}>
          Reason code <span aria-hidden="true">*</span>
          <span className="sr-only">required</span>
        </Label>
        <Select
          value={value.code || undefined}
          onValueChange={(code) => onChange({ ...value, code: code as AdminAdjustmentReasonCode })}
          disabled={disabled}
        >
          <SelectTrigger id={codeId} className="w-full">
            <SelectValue placeholder="Choose a reason code" />
          </SelectTrigger>
          <SelectContent>
            {REASON_CODES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={textId}>
          Reason <span aria-hidden="true">*</span>
          <span className="sr-only">required</span>
        </Label>
        <Textarea
          id={textId}
          value={value.text}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          disabled={disabled}
          rows={3}
          aria-describedby={helpId}
          aria-invalid={tooShort || undefined}
          placeholder="Ticket #4182 — run TRN0000000091 produced an empty report, compensating the user."
          className={cn(tooShort && "border-destructive focus-visible:ring-destructive/40")}
        />
        {/* Always mounted, so a screen reader announces the change rather than the region appearing
            with its content already read past. Same reasoning P2 applied to its waitlist errors. */}
        <p
          id={helpId}
          aria-live="polite"
          className={cn("text-xs", tooShort ? "text-destructive" : "text-muted-foreground")}
        >
          {value.code === "OTHER"
            ? `An uncategorised adjustment needs at least ${required} characters — the code carries no meaning on its own. ${length}/${required}.`
            : `Minimum ${required} characters. Shown to auditors, never to the user. ${length}/${required}.`}
        </p>
      </div>
    </div>
  )
}

/**
 * The optional line the **user** sees in their own statement.
 *
 * Separate from the reason on purpose: "Ticket #4182 — botched run, comping the user" is the right
 * text for an audit trail and the wrong text to show the person it is about.
 */
export function StatementNoteField({
  value,
  onChange,
  disabled,
  idPrefix,
  placeholder = "Credits added by Revquix support",
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  idPrefix: string
  placeholder?: string
}) {
  const id = `${idPrefix}-statement-note`
  const helpId = `${idPrefix}-statement-note-help`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Statement note (optional)</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={2}
        maxLength={255}
        aria-describedby={helpId}
        placeholder={placeholder}
      />
      <p id={helpId} className="text-xs text-muted-foreground">
        Shown in the user&apos;s own credit statement. Leave blank for a neutral default — this is not
        the place for a ticket number.
      </p>
    </div>
  )
}

/** A monospaced identifier cell, so two ids can be compared by eye. */
export function IdCell({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return <span className={cn("font-mono text-xs", className)}>{value}</span>
}

/**
 * A horizontal bar, hand-rolled.
 *
 * No chart library anywhere in this feature. P2, P5 and P6 each made the same call and recorded the
 * same reason: a chart library is ~90 KB gzipped that renders on the JS thread, and a bar is one div
 * with a width. `recharts` is in this repo's dependency tree but is not imported here.
 */
export function MiniBar({
  percent,
  tone = "default",
  label,
}: {
  percent: number
  tone?: "default" | "positive" | "warning" | "danger"
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const toneClass =
    tone === "positive"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : tone === "danger"
          ? "bg-red-500"
          : "bg-primary"

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={label ?? `${clamped.toFixed(1)} percent`}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", toneClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {/* The number accompanies the bar: no result relies on a visual alone. */}
      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {clamped.toFixed(1)}%
      </span>
    </div>
  )
}
