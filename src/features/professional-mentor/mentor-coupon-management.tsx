/**
 * ─── MENTOR COUPON MANAGEMENT ────────────────────────────────────────────────
 *
 * CRUD view for managing mentor-created discount coupons.
 */

"use client"

import React, { useState } from "react"
import { Loader2, Plus, Tag, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import {
  useMyCoupons,
  useCreateCoupon,
  useDeactivateCoupon,
} from "./api/professional-mentor.hooks"
import type { CouponResponse, CreateCouponRequest, DiscountType } from "./api/professional-mentor.types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

export default function MentorCouponManagement() {
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: couponsData, isLoading } = useMyCoupons(page, 20)
  const createMutation = useCreateCoupon(() => setCreateOpen(false))
  const deactivateMutation = useDeactivateCoupon()

  const [form, setForm] = useState<CreateCouponRequest>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxTotalRedemptions: undefined,
    maxRedemptionsPerUser: 1,
    applicableContexts: ["MOCK_INTERVIEW"],
    isMentorSpecific: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons for your mock interviews.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : couponsData?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No coupons yet. Create your first coupon!
                  </TableCell>
                </TableRow>
              ) : (
                couponsData?.content.map((coupon) => (
                  <TableRow key={coupon.couponId}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{coupon.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : coupon.discountType === "FLAT_INR"
                          ? `₹${coupon.discountValue / 100}`
                          : `$${coupon.discountValue / 100}`}
                    </TableCell>
                    <TableCell>
                      {coupon.totalRedemptions}
                      {coupon.maxTotalRedemptions ? `/${coupon.maxTotalRedemptions}` : ""}
                    </TableCell>
                    <TableCell>{formatDate(coupon.validUntil)}</TableCell>
                    <TableCell>
                      {coupon.isActive ? (
                        <Badge className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive"
                          onClick={() => deactivateMutation.mutate(coupon.couponId)}
                          disabled={deactivateMutation.isPending}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {couponsData && couponsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={couponsData.first} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {couponsData.number + 1} of {couponsData.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={couponsData.last} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                placeholder="e.g., MENTOR50"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                maxLength={30}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm({ ...form, discountType: v as DiscountType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT_INR">Flat INR (₹)</SelectItem>
                    <SelectItem value="FLAT_USD">Flat USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {form.discountType === "PERCENTAGE"
                    ? "Discount (%)"
                    : form.discountType === "FLAT_INR"
                      ? "Discount (₹)"
                      : "Discount ($)"}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={
                    form.discountType === "PERCENTAGE"
                      ? form.discountValue
                      : form.discountValue / 100
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setForm({
                      ...form,
                      discountValue: form.discountType === "PERCENTAGE" ? val : val * 100,
                    })
                  }}
                />
              </div>
            </div>

            {form.discountType === "PERCENTAGE" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={form.maxDiscountInrPaise ? form.maxDiscountInrPaise / 100 : ""}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscountInrPaise: e.target.value ? Number(e.target.value) * 100 : undefined })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Discount ($)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={form.maxDiscountUsdCents ? form.maxDiscountUsdCents / 100 : ""}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscountUsdCents: e.target.value ? Number(e.target.value) * 100 : undefined })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Total Redemptions</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxTotalRedemptions ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, maxTotalRedemptions: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Per User</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxRedemptionsPerUser ?? 1}
                  onChange={(e) => setForm({ ...form, maxRedemptionsPerUser: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom.slice(0, 16)}
                  onChange={(e) => setForm({ ...form, validFrom: new Date(e.target.value).toISOString() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil.slice(0, 16)}
                  onChange={(e) => setForm({ ...form, validUntil: new Date(e.target.value).toISOString() })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.code.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

