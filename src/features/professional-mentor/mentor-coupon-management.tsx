/**
 * ─── MENTOR COUPON MANAGEMENT (ADMIN) ────────────────────────────────────────
 *
 * Admin view for searching all coupons via POST /coupons/admin/search.
 * Uses GenericFilterResponse + DataExplorer for filtering, sorting & pagination.
 */

"use client"

import React, { useState } from "react"
import { Loader2, Plus, X, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"

import { searchCoupons } from "./api/professional-mentor.api"
import { useCreateCoupon, useDeactivateCoupon } from "./api/professional-mentor.hooks"
import type { CouponResponse, CreateCouponRequest, DiscountType } from "./api/professional-mentor.types"

// ─── Filter configuration ─────────────────────────────────────────────────────

const COUPON_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["code"],
  filterFields: [
    {
      field: "isActive",
      label: "Status",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
    },
    {
      field: "discountType",
      label: "Discount Type",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Percentage (%)", value: "PERCENTAGE" },
        { label: "Flat INR (₹)", value: "FLAT_INR" },
        { label: "Flat USD ($)", value: "FLAT_USD" },
      ],
    },
    {
      field: "isMentorSpecific",
      label: "Mentor Specific",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Created Date", type: "INSTANT" },
    { field: "validUntil", label: "Valid Until", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Created Date" },
    { field: "validUntil", label: "Valid Until" },
    { field: "code", label: "Code" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: DataColumn<CouponResponse>[] = [
  { key: "code", header: "Code", sortable: true },
  { key: "discountType", header: "Discount", sortable: false },
  { key: "totalRedemptions", header: "Usage", sortable: false },
  { key: "validUntil", header: "Valid Until", sortable: true },
  { key: "isActive", header: "Status", sortable: false },
  { key: "createdAt", header: "Created", sortable: true },
  { key: "couponId", header: "", sortable: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function formatDiscount(coupon: CouponResponse) {
  if (coupon.discountType === "PERCENTAGE") return `${coupon.discountValue}%`
  if (coupon.discountType === "FLAT_INR") return `₹${(coupon.discountValue / 100).toLocaleString("en-IN")}`
  return `$${(coupon.discountValue / 100).toFixed(2)}`
}

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM: CreateCouponRequest = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  validFrom: new Date().toISOString(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  maxTotalRedemptions: undefined,
  maxRedemptionsPerUser: 1,
  applicableContexts: ["MOCK_INTERVIEW", "HOURLY_SESSION"],
  isMentorSpecific: false,
  targetedEmails: [],
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MentorCouponManagement() {
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateCouponRequest>(DEFAULT_FORM)
  const [emailInput, setEmailInput] = useState("")

  const search = useGenericSearch<CouponResponse>({
    queryKey: "admin-coupons",
    searchFn: searchCoupons,
    config: COUPON_FILTER_CONFIG,
  })

  const createMutation = useCreateCoupon(() => {
    setCreateOpen(false)
    setForm(DEFAULT_FORM)
    setEmailInput("")
    search.refetch()
  })

  const deactivateMutation = useDeactivateCoupon(() => search.refetch())

  function addEmail() {
    const email = emailInput.trim().toLowerCase()
    if (email && !form.targetedEmails?.includes(email)) {
      setForm({ ...form, targetedEmails: [...(form.targetedEmails ?? []), email] })
      setEmailInput("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coupon Management</h1>
        <p className="text-muted-foreground">Search and manage all discount coupons across the platform.</p>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        headerActions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Coupon
          </Button>
        }
        renderRow={(coupon) => (
          <TableRow key={coupon.couponId}>
            <TableCell>
              <Badge variant="outline" className="font-mono">{coupon.code}</Badge>
            </TableCell>
            <TableCell>{formatDiscount(coupon)}</TableCell>
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
            <TableCell>{formatDate(coupon.createdAt)}</TableCell>
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
        )}
      />

      {/* ── Create Coupon Dialog ──────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Platform-wide notice */}
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
              This coupon will be <strong>platform-wide</strong> — redeemable with <strong>any mentor</strong>, not restricted to a specific one.
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                placeholder="e.g., MENTOR50"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                maxLength={30}
              />
            </div>

            {/* Discount Type + Value */}
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

            {/* Max discount caps (percentage only) */}
            {form.discountType === "PERCENTAGE" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={form.maxDiscountInrPaise ? form.maxDiscountInrPaise / 100 : ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxDiscountInrPaise: e.target.value ? Number(e.target.value) * 100 : undefined,
                      })
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
                      setForm({
                        ...form,
                        maxDiscountUsdCents: e.target.value ? Number(e.target.value) * 100 : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Redemption limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Total Redemptions</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxTotalRedemptions ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxTotalRedemptions: e.target.value ? Number(e.target.value) : undefined,
                    })
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

            {/* Validity dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom.slice(0, 16)}
                  onChange={(e) =>
                    setForm({ ...form, validFrom: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil.slice(0, 16)}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
            </div>

            {/* Service scope */}
            <div className="space-y-2">
              <Label>Service Scope</Label>
              <Select
                value={
                  form.applicableContexts?.includes("MOCK_INTERVIEW") &&
                  form.applicableContexts?.includes("HOURLY_SESSION")
                    ? "BOTH"
                    : (form.applicableContexts?.[0] ?? "BOTH")
                }
                onValueChange={(v) => {
                  const contexts =
                    v === "BOTH" ? ["MOCK_INTERVIEW", "HOURLY_SESSION"] : [v]
                  setForm({ ...form, applicableContexts: contexts })
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Both Services</SelectItem>
                  <SelectItem value="MOCK_INTERVIEW">Mock Interview only</SelectItem>
                  <SelectItem value="HOURLY_SESSION">Hourly Session only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Targeted emails */}
            <div className="space-y-2">
              <Label>Target Specific Users (optional)</Label>
              <p className="text-xs text-muted-foreground">
                If provided, only these email addresses can redeem the coupon.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email and press Enter"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addEmail()
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={addEmail}>
                  Add
                </Button>
              </div>
              {(form.targetedEmails ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(form.targetedEmails ?? []).map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1">
                      {email}
                      <button
                        type="button"
                        className="ml-1 rounded-full hover:bg-destructive/20 focus:outline-none"
                        onClick={() =>
                          setForm({
                            ...form,
                            targetedEmails: form.targetedEmails?.filter((e) => e !== email),
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
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
