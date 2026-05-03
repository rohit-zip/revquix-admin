/**
 * ─── OFFER STATUS BADGE ──────────────────────────────────────────────────────
 *
 * Reusable badge component for OfferOrderStatus values.
 */

import { Badge } from "@/components/ui/badge"
import type { OfferOrderStatus } from "../api/offer-service.types"

interface OfferStatusBadgeProps {
  status: OfferOrderStatus | string
}

const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  PENDING_PAYMENT:      { variant: "secondary", label: "Pending Payment" },
  PAYMENT_FAILED:       { variant: "destructive", label: "Payment Failed" },
  CONFIRMED:            { variant: "default", label: "Confirmed" },
  IN_PROGRESS:          { variant: "default", label: "In Progress" },
  COMPLETED:            { variant: "default", label: "Completed" },
  CANCELLED_BY_USER:    { variant: "outline", label: "Cancelled by User" },
  CANCELLED_BY_REVQUIX: { variant: "outline", label: "Cancelled by Revquix" },
  EXPIRED:              { variant: "secondary", label: "Expired" },
}

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { variant: "outline" as const, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
