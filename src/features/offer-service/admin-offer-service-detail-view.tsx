/**
 * ─── ADMIN OFFER SERVICE DETAIL VIEW ─────────────────────────────────────────
 *
 * Full admin management view for a single offer service.
 * Tabs: Overview | Plans | Add-ons | Form Fields
 * Route: /offer-services/[serviceId]
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Edit2,
  Package,
  Plus,
  Save,
  Star,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useAdminOfferServiceDetail,
  useAdminUpdateOfferService,
  useAdminCreateOfferPlan,
  useAdminUpdateOfferPlan,
  useAdminCreateOfferAddOn,
  useAdminUpdateOfferAddOn,
  useAdminCreateOfferFormField,
  useAdminUpdateOfferFormField,
  useAdminReviewCandidates,
  useAdminSetFeaturedReviews,
} from "./api/offer-service.hooks"
import type {
  CreateOfferAddOnRequest,
  CreateOfferFormFieldRequest,
  CreateOfferPlanRequest,
  OfferAddOnResponse,
  OfferFormFieldResponse,
  OfferPlanResponse,
  OfferReviewResponse,
  UpdateOfferServiceRequest,
} from "./api/offer-service.types"
import {
  OFFER_PLAN_TIER_OPTIONS,
  OFFER_SERVICE_CATEGORY_OPTIONS,
  OFFER_FORM_FIELD_TYPE,
} from "./api/offer-service.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

// ─── Plan feature helpers ───────────────────────────────────────────────────
//
// A plan's `features` column stores a canonical JSON array of bullet strings
// (e.g. `["Full ATS audit","48-hour turnaround"]`) — the format the public
// web reads (see `parseOfferFeatures` in revquix-web). The admin edits them
// as a friendly "one per line" textarea, so these two helpers translate
// between the two representations. Both are backward-compatible with every
// historical value: a JSON array, legacy newline text, or bullet-prefixed
// text all open cleanly for editing.

/** Parse a stored `features` value into newline-joined text for the textarea. */
function featuresToText(raw: string | null | undefined): string {
  const source = raw?.trim()
  if (!source) return ""
  try {
    const parsed = JSON.parse(source)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .join("\n")
    }
  } catch {
    // Not JSON — fall through to legacy newline/bullet parsing.
  }
  return source
    .split(/\r?\n|•/g)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .join("\n")
}

/**
 * Serialize the "one per line" textarea into the canonical JSON array string.
 * Leading bullet markers (`- `, `* `, `• `) and blank lines are dropped so
 * pasting a bulleted list Just Works. Returns `"[]"` when empty so clearing
 * the list persists as an explicit empty array (the backend only applies
 * non-null values on update).
 */
function textToFeaturesJson(text: string): string {
  const items = text
    .split(/\r?\n|•/g)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
  return JSON.stringify(items)
}

/**
 * "One per line" plan features editor. Holds the raw textarea text in the
 * parent's form state; the parent serializes it with {@link textToFeaturesJson}
 * on submit. Shared by the Add Plan dialog and the Edit Plan form.
 */
function PlanFeaturesField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const count = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean).length

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>Features</Label>
        <span className="text-xs text-muted-foreground">
          {count} feature{count === 1 ? "" : "s"} · one per line
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={
          "Full ATS-parseability audit\nKeyword gap analysis vs. your target role\nWritten audit report\n48-hour turnaround"
        }
      />
      <p className="text-xs text-muted-foreground">
        One feature per line. Shown as the bullet list on the plan card on the public
        service page.
      </p>
    </div>
  )
}

/** Read-only preview of a plan's features on its admin card (first few + count). */
function PlanFeaturesPreview({ features }: { features: string | null }) {
  const items = featuresToText(features).split("\n").filter(Boolean)
  if (items.length === 0) {
    return (
      <p className="border-t pt-2 mt-1 text-xs italic text-muted-foreground">
        No features yet — click edit to add them.
      </p>
    )
  }
  return (
    <div className="border-t pt-2 mt-1">
      <p className="mb-1 text-xs text-muted-foreground">Features ({items.length})</p>
      <ul className="space-y-1">
        {items.slice(0, 4).map((feature, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span className="line-clamp-1">{feature}</span>
          </li>
        ))}
        {items.length > 4 && (
          <li className="pl-[18px] text-xs text-muted-foreground">
            +{items.length - 4} more
          </li>
        )}
      </ul>
    </div>
  )
}

// ─── Edit Service Panel ───────────────────────────────────────────────────────

interface EditServicePanelProps {
  serviceId: string
  initial: UpdateOfferServiceRequest & { displayName: string }
  onDone: () => void
}

function EditServicePanel({ serviceId, initial, onDone }: EditServicePanelProps) {
  const [form, setForm] = useState<UpdateOfferServiceRequest & { displayName: string }>(initial)
  const { mutate: update, isPending } = useAdminUpdateOfferService(serviceId, onDone)
  const set = (key: keyof typeof form, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Service Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.serviceCategory ?? "CAREER"}
              onValueChange={(v) => set("serviceCategory", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OFFER_SERVICE_CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Short Description</Label>
          <Textarea
            value={form.shortDescription ?? ""}
            onChange={(e) => set("shortDescription", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Long Description</Label>
          <Textarea
            value={form.longDescription ?? ""}
            onChange={(e) => set("longDescription", e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Cover Image URL</Label>
            <Input
              value={form.coverImageUrl ?? ""}
              onChange={(e) => set("coverImageUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => set("sortOrder", parseInt(e.target.value, 10))}
              min={0}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isEnabled ?? false}
              onCheckedChange={(v) => set("isEnabled", v)}
            />
            <Label>Enabled</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isDraft ?? true}
              onCheckedChange={(v) => set("isDraft", v)}
            />
            <Label>Draft</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.reviewsEnabled ?? true}
              onCheckedChange={(v) => set("reviewsEnabled", v)}
            />
            <Label>Show reviews carousel</Label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => update(form)} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onDone} disabled={isPending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Plans Tab ────────────────────────────────────────────────────────────────

interface PlansTabProps {
  serviceId: string
  plans: OfferPlanResponse[]
}

function PlansTab({ serviceId, plans }: PlansTabProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<OfferPlanResponse | null>(null)

  const { mutate: createPlan, isPending: creating } = useAdminCreateOfferPlan(serviceId, () => {
    setAddOpen(false)
  })
  const { mutate: updatePlan, isPending: updating } = useAdminUpdateOfferPlan(serviceId, () => {
    setEditPlan(null)
  })

  const [newPlan, setNewPlan] = useState<CreateOfferPlanRequest>({
    serviceId,
    planTier: "BASIC",
    displayName: "",
    tagline: "",
    features: "",
    priceInrPaise: 0,
    priceUsdCents: 0,
    slaHours: 72,
    isActive: true,
    sortOrder: 0,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{plans.length} plan(s) configured</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.planId} className={plan.isActive ? "" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{plan.planTier}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditPlan(plan)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CardTitle className="text-base mt-1">{plan.displayName}</CardTitle>
              {plan.tagline && (
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price (INR)</span>
                <span className="font-medium">{formatPrice(plan.priceInrPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA</span>
                <span>{plan.slaHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active</span>
                <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
                  {plan.isActive ? "Yes" : "No"}
                </Badge>
              </div>
              <PlanFeaturesPreview features={plan.features} />
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-3">No plans yet. Add one to get started.</p>
        )}
      </div>

      {/* Add Plan Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tier *</Label>
                <Select
                  value={newPlan.planTier}
                  onValueChange={(v) => setNewPlan((p) => ({ ...p, planTier: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OFFER_PLAN_TIER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Display Name *</Label>
                <Input
                  value={newPlan.displayName}
                  onChange={(e) => setNewPlan((p) => ({ ...p, displayName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input
                value={newPlan.tagline ?? ""}
                onChange={(e) => setNewPlan((p) => ({ ...p, tagline: e.target.value }))}
              />
            </div>
            <PlanFeaturesField
              value={newPlan.features ?? ""}
              onChange={(value) => setNewPlan((p) => ({ ...p, features: value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (INR paise) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={newPlan.priceInrPaise}
                  onChange={(e) => setNewPlan((p) => ({ ...p, priceInrPaise: parseInt(e.target.value, 10) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  Price (USD cents)
                  <span className="text-xs font-normal text-muted-foreground">(not active)</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={newPlan.priceUsdCents}
                  onChange={(e) => setNewPlan((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))}
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SLA (hours)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newPlan.slaHours ?? 72}
                  onChange={(e) => setNewPlan((p) => ({ ...p, slaHours: parseInt(e.target.value, 10) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={newPlan.sortOrder ?? 0}
                  onChange={(e) => setNewPlan((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newPlan.isActive ?? true}
                onCheckedChange={(v) => setNewPlan((p) => ({ ...p, isActive: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() =>
                createPlan({
                  ...newPlan,
                  features: textToFeaturesJson(newPlan.features ?? ""),
                })
              }
              disabled={creating || !newPlan.displayName}
            >
              {creating ? "Adding…" : "Add Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      {editPlan && (
        <Dialog open onOpenChange={(v) => !v && setEditPlan(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Plan — {editPlan.displayName}</DialogTitle>
            </DialogHeader>
            <EditPlanForm
              plan={editPlan}
              onSave={(req) => updatePlan({ planId: editPlan.planId, request: req })}
              onCancel={() => setEditPlan(null)}
              isPending={updating}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface EditPlanFormProps {
  plan: OfferPlanResponse
  onSave: (req: import("./api/offer-service.types").UpdateOfferPlanRequest) => void
  onCancel: () => void
  isPending: boolean
}

function EditPlanForm({ plan, onSave, onCancel, isPending }: EditPlanFormProps) {
  const [form, setForm] = useState({
    displayName: plan.displayName,
    tagline: plan.tagline ?? "",
    features: featuresToText(plan.features),
    priceInrPaise: plan.priceInrPaise,
    priceUsdCents: plan.priceUsdCents,
    slaHours: plan.slaHours,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  })

  return (
    <div className="space-y-3 py-2">
      <div className="space-y-1.5">
        <Label>Display Name</Label>
        <Input
          value={form.displayName}
          onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tagline</Label>
        <Input
          value={form.tagline}
          onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
        />
      </div>
      <PlanFeaturesField
        value={form.features}
        onChange={(value) => setForm((p) => ({ ...p, features: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Price (INR paise)</Label>
          <Input
            type="number"
            min={0}
            value={form.priceInrPaise}
            onChange={(e) => setForm((p) => ({ ...p, priceInrPaise: parseInt(e.target.value, 10) }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            Price (USD cents)
            <span className="text-xs font-normal text-muted-foreground">(not active)</span>
          </Label>
          <Input
            type="number"
            min={0}
            value={form.priceUsdCents}
            onChange={(e) => setForm((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))}
            disabled
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>SLA (hours)</Label>
          <Input
            type="number"
            min={1}
            value={form.slaHours}
            onChange={(e) => setForm((p) => ({ ...p, slaHours: parseInt(e.target.value, 10) }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Sort Order</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.isActive}
          onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
        />
        <Label>Active</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave({ ...form, features: textToFeaturesJson(form.features) })}
          disabled={isPending}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Add-ons Tab ──────────────────────────────────────────────────────────────

interface AddOnsTabProps {
  serviceId: string
  addOns: OfferAddOnResponse[]
}

function AddOnsTab({ serviceId, addOns }: AddOnsTabProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [editAddOn, setEditAddOn] = useState<OfferAddOnResponse | null>(null)
  const [form, setForm] = useState<CreateOfferAddOnRequest>({
    serviceId,
    displayName: "",
    description: "",
    priceInrPaise: 0,
    priceUsdCents: 0,
    requiredPlanTiers: "",
    isActive: true,
    sortOrder: 0,
  })

  const { mutate: create, isPending: creating } = useAdminCreateOfferAddOn(serviceId, () => setAddOpen(false))
  const { mutate: update, isPending: updating } = useAdminUpdateOfferAddOn(serviceId, () => setEditAddOn(null))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{addOns.length} add-on(s) configured</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Add-on
        </Button>
      </div>

      <div className="space-y-2">
        {addOns.map((addon) => (
          <div
            key={addon.addOnId}
            className={`flex items-center justify-between p-3 border rounded-lg ${addon.isActive ? "" : "opacity-60"}`}
          >
            <div>
              <p className="font-medium text-sm">{addon.displayName}</p>
              {addon.description && (
                <p className="text-xs text-muted-foreground">{addon.description}</p>
              )}
              <div className="flex gap-2 mt-1">
                <span className="text-xs">{formatPrice(addon.priceInrPaise)}</span>
                {!addon.isActive && (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditAddOn(addon)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {addOns.length === 0 && (
          <p className="text-muted-foreground text-sm">No add-ons yet.</p>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Add-on</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Display Name *</Label>
              <Input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (INR paise) *</Label>
                <Input type="number" min={0} value={form.priceInrPaise} onChange={(e) => setForm((p) => ({ ...p, priceInrPaise: parseInt(e.target.value, 10) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  Price (USD cents)
                  <span className="text-xs font-normal text-muted-foreground">(not active)</span>
                </Label>
                <Input type="number" min={0} value={form.priceUsdCents} onChange={(e) => setForm((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Required Plan Tiers (JSON array or blank for all)</Label>
              <Input value={form.requiredPlanTiers ?? ""} onChange={(e) => setForm((p) => ({ ...p, requiredPlanTiers: e.target.value || undefined }))} placeholder='["STANDARD","PREMIUM"]' />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive ?? true} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => create(form)} disabled={creating || !form.displayName}>{creating ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editAddOn && (
        <Dialog open onOpenChange={(v) => !v && setEditAddOn(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Add-on — {editAddOn.displayName}</DialogTitle></DialogHeader>
            <EditAddOnForm
              addOn={editAddOn}
              onSave={(req) => update({ addOnId: editAddOn.addOnId, request: req })}
              onCancel={() => setEditAddOn(null)}
              isPending={updating}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface EditAddOnFormProps {
  addOn: OfferAddOnResponse
  onSave: (req: import("./api/offer-service.types").UpdateOfferAddOnRequest) => void
  onCancel: () => void
  isPending: boolean
}

function EditAddOnForm({ addOn, onSave, onCancel, isPending }: EditAddOnFormProps) {
  const [form, setForm] = useState({
    displayName: addOn.displayName,
    description: addOn.description ?? "",
    priceInrPaise: addOn.priceInrPaise,
    priceUsdCents: addOn.priceUsdCents,
    requiredPlanTiers: addOn.requiredPlanTiers ?? "",
    isActive: addOn.isActive,
    sortOrder: addOn.sortOrder,
  })

  return (
    <div className="space-y-3 py-2">
      <div className="space-y-1.5">
        <Label>Display Name</Label>
        <Input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Price (INR paise)</Label>
          <Input type="number" min={0} value={form.priceInrPaise} onChange={(e) => setForm((p) => ({ ...p, priceInrPaise: parseInt(e.target.value, 10) }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            Price (USD cents)
            <span className="text-xs font-normal text-muted-foreground">(not active)</span>
          </Label>
          <Input type="number" min={0} value={form.priceUsdCents} onChange={(e) => setForm((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))} disabled />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Required Plan Tiers</Label>
          <Input value={form.requiredPlanTiers} onChange={(e) => setForm((p) => ({ ...p, requiredPlanTiers: e.target.value }))} placeholder='["STANDARD","PREMIUM"]' />
        </div>
        <div className="space-y-1.5">
          <Label>Sort Order</Label>
          <Input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
        <Label>Active</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </div>
  )
}

// ─── Form Fields Tab ──────────────────────────────────────────────────────────

interface FormFieldsTabProps {
  serviceId: string
  fields: OfferFormFieldResponse[]
}

/** Field types whose behaviour depends on a fixed list of options the admin defines. */
const OPTION_BASED_FIELD_TYPES = new Set(["DROPDOWN", "RADIO", "CHECKBOX_GROUP"])

/** Parses an `options` JSON array string into a clean, non-empty string list. */
function parseNonEmptyOptions(options: string | null | undefined): string[] {
  if (!options) return []
  try {
    const value = JSON.parse(options)
    if (!Array.isArray(value)) return []
    return value.map((v) => String(v).trim()).filter((v) => v.length > 0)
  } catch {
    return []
  }
}

/**
 * Add/remove/edit list of plain-text options, serialized to the JSON array
 * string the backend stores in `OfferFormField.options` (e.g. `["A","B"]`).
 * Shared by the Add Field dialog and Edit Field form — DROPDOWN populates
 * a `<select>`, RADIO a group of radio buttons, and CHECKBOX_GROUP a set of
 * independently-selectable checkboxes on the public order page, all driven
 * by this same option list (see `DynamicField` in
 * revquix-web/offer-service-detail-view.tsx).
 */
function OptionsListEditor({
  options,
  onChange,
}: {
  options: string
  onChange: (options: string) => void
}) {
  const parsed: string[] = (() => {
    if (!options) return []
    try {
      const value = JSON.parse(options)
      return Array.isArray(value) ? value.map((v) => String(v)) : []
    } catch {
      return []
    }
  })()

  const commit = (next: string[]) => onChange(JSON.stringify(next))

  return (
    <div className="space-y-1.5 rounded-md border border-dashed p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label>Options *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7"
          onClick={() => commit([...parsed, ""])}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add option
        </Button>
      </div>
      {parsed.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No options yet — add at least one before saving.
        </p>
      )}
      <div className="space-y-1.5">
        {parsed.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...parsed]
                next[idx] = e.target.value
                commit(next)
              }}
              placeholder={`Option ${idx + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 shrink-0"
              onClick={() => commit(parsed.filter((_, i) => i !== idx))}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Shown to customers as the selectable choices for this field.
      </p>
    </div>
  )
}

const MAX_FEATURED_REVIEWS = 10

/**
 * Review picker — lets the admin choose up to 10 real customer reviews
 * (from OfferOrderRating submissions) to feature in the public carousel on
 * the service's detail page. Never authors review content; only selects
 * and orders existing submissions. The service-wide "turn reviews off
 * entirely" switch lives in EditServicePanel (alongside Enabled/Draft) since
 * it's a service-level field, not a review-specific one — this tab only
 * manages which reviews are picked when the carousel is on.
 */
function ReviewsTab({
  serviceId,
  reviewsEnabled,
}: {
  serviceId: string
  reviewsEnabled: boolean
}) {
  const { data: candidates, isLoading } = useAdminReviewCandidates(serviceId)
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null)
  const { mutate: save, isPending } = useAdminSetFeaturedReviews(serviceId, () => setSelectedIds(null))

  // Seed local selection from the server's isFeatured flags once candidates
  // load; `selectedIds === null` means "not yet touched by the admin this
  // session" so we keep re-seeding from fresh data until they actually
  // check/uncheck something.
  const effectiveSelected =
    selectedIds ?? candidates?.filter((r) => r.isFeatured).map((r) => r.ratingId) ?? []

  const toggle = (ratingId: string, checked: boolean) => {
    const base = selectedIds ?? effectiveSelected
    setSelectedIds(checked ? [...base, ratingId] : base.filter((id) => id !== ratingId))
  }

  const atLimit = effectiveSelected.length >= MAX_FEATURED_REVIEWS
  const isDirty = selectedIds !== null

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-lg" />
  }

  return (
    <div className="space-y-4">
      {!reviewsEnabled && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          The reviews carousel is currently turned OFF for this service (see the &ldquo;Show
          reviews carousel&rdquo; switch in Edit Service Details). Featured picks below are
          still saved but won&apos;t be visible on the public page until it&apos;s turned back on.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {effectiveSelected.length} / {MAX_FEATURED_REVIEWS} featured
        </p>
        {isDirty && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(null)} disabled={isPending}>
              Discard
            </Button>
            <Button size="sm" onClick={() => save({ ratingIds: effectiveSelected })} disabled={isPending}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isPending ? "Saving…" : "Save featured reviews"}
            </Button>
          </div>
        )}
      </div>

      {!candidates || candidates.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No customer reviews have been submitted for this service yet.
        </p>
      ) : (
        <div className="space-y-2">
          {candidates.map((review) => (
            <ReviewCandidateRow
              key={review.ratingId}
              review={review}
              checked={effectiveSelected.includes(review.ratingId)}
              disabled={atLimit && !effectiveSelected.includes(review.ratingId)}
              onChange={(checked) => toggle(review.ratingId, checked)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCandidateRow({
  review,
  checked,
  disabled,
  onChange,
}: {
  review: OfferReviewResponse
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/50"
      } ${checked ? "border-primary bg-primary/5" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{review.reviewerName}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(review.createdAt)}</span>
        </div>
        {review.reviewText ? (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{review.reviewText}</p>
        ) : (
          <p className="mt-1 text-xs italic text-muted-foreground">No written review — star rating only.</p>
        )}
      </div>
    </label>
  )
}

function FormFieldsTab({ serviceId, fields }: FormFieldsTabProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [editField, setEditField] = useState<OfferFormFieldResponse | null>(null)
  const [form, setForm] = useState<CreateOfferFormFieldRequest>({
    serviceId,
    fieldKey: "",
    fieldLabel: "",
    fieldType: "TEXT_INPUT",
    placeholder: "",
    helperText: "",
    isRequired: false,
    sortOrder: 0,
    isEnabled: true,
    allowedMimeTypes: "",
    maxFileSizeMb: undefined,
    options: "",
  })

  const { mutate: create, isPending: creating } = useAdminCreateOfferFormField(serviceId, () => setAddOpen(false))
  const { mutate: update, isPending: updating } = useAdminUpdateOfferFormField(serviceId, () => setEditField(null))

  const FIELD_TYPE_OPTIONS = Object.values(OFFER_FORM_FIELD_TYPE).map((v) => ({ label: v, value: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{fields.length} field(s) configured</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.fieldId}
            className={`flex items-center justify-between p-3 border rounded-lg ${field.isEnabled ? "" : "opacity-60"}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{field.fieldLabel}</span>
                <Badge variant="outline" className="text-xs">{field.fieldType}</Badge>
                {field.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                {!field.isEnabled && <Badge variant="secondary" className="text-xs">Disabled</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                key: <code className="font-mono">{field.fieldKey}</code>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditField(field)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-muted-foreground text-sm">No form fields yet.</p>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Form Field</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Field Key *</Label>
                <Input value={form.fieldKey} onChange={(e) => setForm((p) => ({ ...p, fieldKey: e.target.value }))} placeholder="e.g. current_role" />
              </div>
              <div className="space-y-1.5">
                <Label>Field Label *</Label>
                <Input value={form.fieldLabel} onChange={(e) => setForm((p) => ({ ...p, fieldLabel: e.target.value }))} placeholder="e.g. Current Role" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Field Type *</Label>
              <Select value={form.fieldType} onValueChange={(v) => setForm((p) => ({ ...p, fieldType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Placeholder</Label>
                <Input value={form.placeholder ?? ""} onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" min={0} value={form.sortOrder ?? 0} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Helper Text</Label>
              <Input value={form.helperText ?? ""} onChange={(e) => setForm((p) => ({ ...p, helperText: e.target.value }))} />
            </div>
            {OPTION_BASED_FIELD_TYPES.has(form.fieldType) && (
              <OptionsListEditor
                options={form.options ?? ""}
                onChange={(options) => setForm((p) => ({ ...p, options }))}
              />
            )}
            {form.fieldType === "FILE_UPLOAD" && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed p-3 bg-muted/30">
                <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  File Upload Settings
                </div>
                <div className="space-y-1.5">
                  <Label>Allowed MIME Types</Label>
                  <Input
                    value={form.allowedMimeTypes ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, allowedMimeTypes: e.target.value }))}
                    placeholder="e.g. application/pdf"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated, e.g. <code>application/pdf,image/jpeg</code></p>
                </div>
                <div className="space-y-1.5">
                  <Label>Max File Size (MB)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxFileSizeMb ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, maxFileSizeMb: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isRequired ?? false} onCheckedChange={(v) => setForm((p) => ({ ...p, isRequired: v }))} />
                <Label>Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isEnabled ?? true} onCheckedChange={(v) => setForm((p) => ({ ...p, isEnabled: v }))} />
                <Label>Enabled</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const isOptionBased = OPTION_BASED_FIELD_TYPES.has(form.fieldType)
                const cleanOptions = parseNonEmptyOptions(form.options)
                create({
                  ...form,
                  options: isOptionBased ? JSON.stringify(cleanOptions) : undefined,
                })
              }}
              disabled={
                creating ||
                !form.fieldKey ||
                !form.fieldLabel ||
                (OPTION_BASED_FIELD_TYPES.has(form.fieldType) && parseNonEmptyOptions(form.options).length === 0)
              }
            >
              {creating ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editField && (
        <Dialog open onOpenChange={(v) => !v && setEditField(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Field — {editField.fieldLabel}</DialogTitle></DialogHeader>
            <EditFormFieldForm
              field={editField}
              onSave={(req) => update({ fieldId: editField.fieldId, request: req })}
              onCancel={() => setEditField(null)}
              isPending={updating}
              fieldTypeOptions={FIELD_TYPE_OPTIONS}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface EditFormFieldFormProps {
  field: OfferFormFieldResponse
  onSave: (req: import("./api/offer-service.types").UpdateOfferFormFieldRequest) => void
  onCancel: () => void
  isPending: boolean
  fieldTypeOptions: { label: string; value: string }[]
}

function EditFormFieldForm({ field, onSave, onCancel, isPending, fieldTypeOptions }: EditFormFieldFormProps) {
  const [form, setForm] = useState({
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType,
    placeholder: field.placeholder ?? "",
    helperText: field.helperText ?? "",
    isRequired: field.isRequired,
    isEnabled: field.isEnabled,
    sortOrder: field.sortOrder,
    allowedMimeTypes: field.allowedMimeTypes ?? "",
    maxFileSizeMb: field.maxFileSizeMb ?? undefined as number | undefined,
    options: field.options ?? "",
  })

  return (
    <div className="space-y-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Field Label</Label>
          <Input value={form.fieldLabel} onChange={(e) => setForm((p) => ({ ...p, fieldLabel: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Field Type</Label>
          <Select value={form.fieldType} onValueChange={(v) => setForm((p) => ({ ...p, fieldType: v as import("./api/offer-service.types").OfferFormFieldType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {fieldTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Placeholder</Label>
          <Input value={form.placeholder} onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Sort Order</Label>
          <Input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) }))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Helper Text</Label>
        <Input value={form.helperText} onChange={(e) => setForm((p) => ({ ...p, helperText: e.target.value }))} />
      </div>
      {OPTION_BASED_FIELD_TYPES.has(form.fieldType) && (
        <OptionsListEditor
          options={form.options}
          onChange={(options) => setForm((p) => ({ ...p, options }))}
        />
      )}
      {form.fieldType === "FILE_UPLOAD" && (
        <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed p-3 bg-muted/30">
          <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            File Upload Settings
          </div>
          <div className="space-y-1.5">
            <Label>Allowed MIME Types</Label>
            <Input
              value={form.allowedMimeTypes}
              onChange={(e) => setForm((p) => ({ ...p, allowedMimeTypes: e.target.value }))}
              placeholder="e.g. application/pdf"
            />
            <p className="text-xs text-muted-foreground">Comma-separated, e.g. <code>application/pdf,image/jpeg</code></p>
          </div>
          <div className="space-y-1.5">
            <Label>Max File Size (MB)</Label>
            <Input
              type="number"
              min={1}
              value={form.maxFileSizeMb ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, maxFileSizeMb: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              placeholder="e.g. 5"
            />
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={form.isRequired} onCheckedChange={(v) => setForm((p) => ({ ...p, isRequired: v }))} />
          <Label>Required</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.isEnabled} onCheckedChange={(v) => setForm((p) => ({ ...p, isEnabled: v }))} />
          <Label>Enabled</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => {
            const isOptionBased = OPTION_BASED_FIELD_TYPES.has(form.fieldType)
            const cleanOptions = parseNonEmptyOptions(form.options)
            onSave({
              ...form,
              options: isOptionBased ? JSON.stringify(cleanOptions) : undefined,
            })
          }}
          disabled={
            isPending ||
            (OPTION_BASED_FIELD_TYPES.has(form.fieldType) && parseNonEmptyOptions(form.options).length === 0)
          }
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface AdminOfferServiceDetailViewProps {
  serviceId: string
}

export default function AdminOfferServiceDetailView({ serviceId }: AdminOfferServiceDetailViewProps) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)

  const { data: service, isLoading, isError } = useAdminOfferServiceDetail(serviceId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !service) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Service not found or failed to load.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_OFFER_SERVICES)}
        >
          Back to Services
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_OFFER_SERVICES)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Services
        </Button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{service.displayName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{service.displayName}</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{service.slug}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs capitalize">
              {service.serviceCategory.toLowerCase()}
            </Badge>
            {service.isEnabled ? (
              <Badge variant="default" className="text-xs">Enabled</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Disabled</Badge>
            )}
            {service.isDraft && (
              <Badge variant="outline" className="text-xs">Draft</Badge>
            )}
          </div>
        </div>
        {!editMode && (
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Edit panel */}
      {editMode && (
        <EditServicePanel
          serviceId={service.serviceId}
          initial={{
            displayName: service.displayName,
            shortDescription: service.shortDescription,
            longDescription: service.longDescription ?? "",
            coverImageUrl: service.coverImageUrl ?? "",
            serviceCategory: service.serviceCategory,
            isEnabled: service.isEnabled,
            isDraft: service.isDraft,
            sortOrder: service.sortOrder,
            reviewsEnabled: service.reviewsEnabled,
          }}
          onDone={() => setEditMode(false)}
        />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold mt-1">
              {service.averageRating != null ? service.averageRating.toFixed(1) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Ratings</p>
            <p className="text-2xl font-bold mt-1">{service.ratingCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium mt-1">{formatDate(service.updatedAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">
            Plans ({service.plans?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="addons">
            Add-ons ({service.addOns?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="fields">
            Form Fields ({service.formFields?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <PlansTab serviceId={serviceId} plans={service.plans ?? []} />
        </TabsContent>

        <TabsContent value="addons" className="mt-4">
          <AddOnsTab serviceId={serviceId} addOns={service.addOns ?? []} />
        </TabsContent>

        <TabsContent value="fields" className="mt-4">
          <FormFieldsTab serviceId={serviceId} fields={service.formFields ?? []} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ReviewsTab serviceId={serviceId} reviewsEnabled={service.reviewsEnabled} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
