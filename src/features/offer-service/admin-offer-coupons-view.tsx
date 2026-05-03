/**
 * ─── ADMIN OFFER COUPONS VIEW ─────────────────────────────────────────────────
 *
 * List, create, and deactivate platform-level offer coupons.
 * Route: /offer-coupons
 */

"use client"

import React, { useState } from "react"
import {
  Tag,
  Plus,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  useAdminListPlatformCoupons,
  useAdminCreatePlatformCoupon,
  useAdminDeactivatePlatformCoupon,
} from "./api/offer-service.hooks"
import type { CouponResponse, CreatePlatformCouponRequest } from "./api/offer-service.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDiscount(coupon: CouponResponse) {
  if (coupon.discountType === "PERCENTAGE") return `${coupon.discountValue}%`
  if (coupon.discountType === "FLAT_INR") return `₹${(coupon.discountValue / 100).toLocaleString("en-IN")}`
  if (coupon.discountType === "FLAT_USD") return `$${(coupon.discountValue / 100).toFixed(2)}`
  return `${coupon.discountValue} (${coupon.discountType})`
}

// ─── Create Coupon Dialog ──────────────────────────────────────────────────────

const DISCOUNT_TYPE_OPTIONS = [
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Flat INR", value: "FLAT_INR" },
  { label: "Flat USD", value: "FLAT_USD" },
]

const EMPTY_FORM: CreatePlatformCouponRequest = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 0,
  maxTotalRedemptions: undefined,
  maxRedemptionsPerUser: undefined,
  minOrderInrPaise: undefined,
  minOrderUsdCents: undefined,
  maxDiscountInrPaise: undefined,
  maxDiscountUsdCents: undefined,
  validFrom: "",
  validUntil: "",
}

interface CreateCouponDialogProps {
  open: boolean
  onClose: () => void
}

function CreateCouponDialog({ open, onClose }: CreateCouponDialogProps) {
  const [form, setForm] = useState<CreatePlatformCouponRequest>(EMPTY_FORM)
  const { mutate: create, isPending } = useAdminCreatePlatformCoupon(onClose)

  const set = <K extends keyof CreatePlatformCouponRequest>(
    key: K,
    value: CreatePlatformCouponRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleClose = () => {
    setForm(EMPTY_FORM)
    onClose()
  }

  const isValid = form.code.trim().length > 0 && form.discountValue > 0 && form.validFrom && form.validUntil

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Platform Coupon</DialogTitle>
          <DialogDescription>
            Create a new platform-level discount coupon for offer services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Code */}
          <div className="space-y-1.5">
            <Label>Coupon Code *</Label>
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. REVQUIX20"
              className="font-mono uppercase"
            />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Discount Type *</Label>
              <Select value={form.discountType} onValueChange={(v) => set("discountType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Discount Value * {form.discountType === "PERCENTAGE" ? "(0-100)" : "(minor units)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => set("discountValue", parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Max cap (for percentage) */}
          {form.discountType === "PERCENTAGE" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Max Discount INR (paise)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxDiscountInrPaise ?? ""}
                  onChange={(e) => set("maxDiscountInrPaise", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="No cap"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Discount USD (cents)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxDiscountUsdCents ?? ""}
                  onChange={(e) => set("maxDiscountUsdCents", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="No cap"
                />
              </div>
            </div>
          )}

          {/* Min order value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Min Order INR (paise)</Label>
              <Input
                type="number"
                min={0}
                value={form.minOrderInrPaise ?? ""}
                onChange={(e) => set("minOrderInrPaise", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min Order USD (cents)</Label>
              <Input
                type="number"
                min={0}
                value={form.minOrderUsdCents ?? ""}
                onChange={(e) => set("minOrderUsdCents", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="No minimum"
              />
            </div>
          </div>

          {/* Redemption limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Max Total Redemptions</Label>
              <Input
                type="number"
                min={1}
                value={form.maxTotalRedemptions ?? ""}
                onChange={(e) => set("maxTotalRedemptions", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Per User</Label>
              <Input
                type="number"
                min={1}
                value={form.maxRedemptionsPerUser ?? ""}
                onChange={(e) => set("maxRedemptionsPerUser", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          {/* Validity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valid From *</Label>
              <Input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid Until *</Label>
              <Input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => set("validUntil", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={() => create(form)} disabled={isPending || !isValid}>
            {isPending ? "Creating…" : "Create Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function AdminOfferCouponsView() {
  const [page, setPage] = useState(0)
  const pageSize = 20
  const [createOpen, setCreateOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<CouponResponse | null>(null)

  const { data, isLoading } = useAdminListPlatformCoupons(page, pageSize)
  const { mutate: deactivate, isPending: deactivating } = useAdminDeactivatePlatformCoupon(() => {
    setDeactivateTarget(null)
  })

  const coupons: CouponResponse[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Platform Coupons
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage discount coupons for Global Offer Services.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Separator />

      {/* Stats */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {totalElements} coupon{totalElements !== 1 ? "s" : ""} total
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-center">Redemptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No coupons found.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.couponId}>
                    <TableCell>
                      <span className="font-mono font-semibold text-sm">{coupon.code}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{formatDiscount(coupon)}</span>
                        <p className="text-xs text-muted-foreground capitalize">
                          {coupon.discountType.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{formatDate(coupon.validFrom)}</p>
                      <p className="text-xs text-muted-foreground">to {formatDate(coupon.validUntil)}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">
                        {coupon.totalRedemptions}
                        {coupon.maxTotalRedemptions != null && (
                          <span className="text-muted-foreground"> / {coupon.maxTotalRedemptions}</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {coupon.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {coupon.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setDeactivateTarget(coupon)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateCouponDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Coupon <strong className="font-mono">{deactivateTarget?.code}</strong> will be
              deactivated and can no longer be redeemed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deactivateTarget && deactivate(deactivateTarget.couponId)}
              disabled={deactivating}
            >
              {deactivating ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
