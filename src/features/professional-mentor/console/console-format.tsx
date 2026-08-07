"use client"

/**
 * ─── SHARED FORMATTING FOR THE PROFESSIONAL MENTOR CONSOLE ────────────────────
 *
 * Every table on this console formats money, timestamps and status the same way. Keeping that in one
 * file is not only DRY — it is the only way the two-currency rule below stays enforced, because the
 * moment each table writes its own money formatter one of them starts adding a buyer charge to a
 * mentor net.
 */

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// ─── Money ────────────────────────────────────────────────────────────────────

/**
 * Minor units → a display string, always carrying its own currency.
 *
 * There is deliberately no signature that takes an amount without a currency. An order row holds
 * two amounts in two different currencies (what the buyer paid, what the mentor earns) and the
 * post-order surfaces were corrected once already for rendering them as if they were one number.
 */
export function formatMinor(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = symbolFor(currency)
  const major = minor / 100
  return `${symbol}${major.toLocaleString(undefined, {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function symbolFor(currency?: string | null): string {
  switch ((currency ?? "INR").toUpperCase()) {
    case "INR":
      return "₹"
    case "EUR":
      return "€"
    case "GBP":
      return "£"
    default:
      return "$"
  }
}

// ─── Time ─────────────────────────────────────────────────────────────────────

export function formatWhen(value?: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(value?: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * A signed, human relative time — "in 6h", "6h ago".
 *
 * Never clamped to zero: on an SLA column the sign is the entire message, and a UI that renders an
 * overdue deadline as "0h left" is worse than one that renders nothing.
 */
export function formatRelative(value?: string | null): { text: string; overdue: boolean } | null {
  if (!value) return null
  const deltaMs = new Date(value).getTime() - Date.now()
  const overdue = deltaMs < 0
  const abs = Math.abs(deltaMs)
  const minutes = Math.round(abs / 60_000)
  const hours = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)

  const magnitude = minutes < 60 ? `${minutes}m` : hours < 48 ? `${hours}h` : `${days}d`
  return { text: overdue ? `${magnitude} ago` : `in ${magnitude}`, overdue }
}

/** Hours as a duration string. Used where the server already did the subtraction. */
export function formatHours(hours: number): string {
  if (hours < 1) return "under an hour"
  if (hours < 48) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

// ─── Presentation ─────────────────────────────────────────────────────────────

/** `FEEDBACK_NOT_SUBMITTED` → `Feedback not submitted`. For enums with no server-side label. */
export function humanise(value?: string | null): string {
  if (!value) return "—"
  const lower = value.replaceAll("_", " ").toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const STATUS_TONE: Record<string, BadgeVariant> = {
  // Healthy terminal states
  COMPLETED: "secondary",
  PAID: "secondary",
  RESOLVED: "secondary",
  ACTIVE: "secondary",
  SETTLED: "secondary",
  // In flight
  CONFIRMED: "default",
  RESCHEDULED: "default",
  IN_PROGRESS: "default",
  UNDER_REVIEW: "default",
  INITIATED: "default",
  // Wrong, or heading that way
  DISPUTED: "destructive",
  NO_SHOW_MENTOR: "destructive",
  NO_SHOW_USER: "destructive",
  PAYMENT_FAILED: "destructive",
  ESCALATED: "destructive",
  FAILED: "destructive",
  SUSPENDED: "destructive",
}

/** A status chip whose colour carries meaning rather than decoration. */
export function StatusBadge({ status, label }: { status?: string | null; label?: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant={STATUS_TONE[status] ?? "outline"} className="font-normal">
      {label ?? humanise(status)}
    </Badge>
  )
}

/**
 * A monospace reference that links to its detail page.
 *
 * Monospace on purpose: an operator arrives holding a reference copied out of a support ticket, and
 * matching `BKG00000007` against `BKG00000001` by eye is materially easier in a fixed-width face.
 */
export function RefLink({ id, href }: { id?: string | null; href?: string }) {
  if (!id) return <span className="text-muted-foreground">—</span>
  if (!href) return <span className="font-mono text-xs">{id}</span>
  return (
    <Link
      href={href}
      className="font-mono text-xs underline-offset-2 hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {id}
    </Link>
  )
}

/** Two lines: a name over the id it resolves from. Falls back to the id when the user is gone. */
export function PersonCell({ name, userId }: { name?: string | null; userId?: string | null }) {
  if (!name && !userId) return <span className="text-muted-foreground">—</span>
  return (
    <div className="min-w-0">
      <p className="truncate text-sm">{name ?? "Unknown user"}</p>
      {userId ? <p className="truncate font-mono text-[10px] text-muted-foreground">{userId}</p> : null}
    </div>
  )
}
