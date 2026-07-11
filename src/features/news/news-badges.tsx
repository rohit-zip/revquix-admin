"use client"

import { Badge } from "@/components/ui/badge"
import { STATUS_BADGE_VARIANT, type BlogKind, type BlogStatus } from "./api/news.types"

export function StatusBadge({ status }: { status: BlogStatus }) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} className="capitalize">
      {status.toLowerCase()}
    </Badge>
  )
}

export function KindBadge({ kind }: { kind: BlogKind }) {
  return (
    <Badge variant={kind === "EDITORIAL" ? "default" : "ghost"} className="capitalize">
      {kind.toLowerCase()}
    </Badge>
  )
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
