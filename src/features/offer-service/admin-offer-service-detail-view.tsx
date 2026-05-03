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
  ChevronRight,
  Edit2,
  Package,
  Plus,
  Save,
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
  DialogDescription,
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
} from "./api/offer-service.hooks"
import type {
  CreateOfferAddOnRequest,
  CreateOfferFormFieldRequest,
  CreateOfferPlanRequest,
  OfferAddOnResponse,
  OfferFormFieldResponse,
  OfferPlanResponse,
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
                <Label>Price (USD cents) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={newPlan.priceUsdCents}
                  onChange={(e) => setNewPlan((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))}
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
              onClick={() => createPlan(newPlan)}
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
          <Label>Price (USD cents)</Label>
          <Input
            type="number"
            min={0}
            value={form.priceUsdCents}
            onChange={(e) => setForm((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))}
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
        <Button onClick={() => onSave(form)} disabled={isPending}>
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
                <Label>Price (USD cents) *</Label>
                <Input type="number" min={0} value={form.priceUsdCents} onChange={(e) => setForm((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))} />
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
          <Label>Price (USD cents)</Label>
          <Input type="number" min={0} value={form.priceUsdCents} onChange={(e) => setForm((p) => ({ ...p, priceUsdCents: parseInt(e.target.value, 10) }))} />
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

function FormFieldsTab({ serviceId, fields }: FormFieldsTabProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [editField, setEditField] = useState<OfferFormFieldResponse | null>(null)
  const [form, setForm] = useState<CreateOfferFormFieldRequest>({
    serviceId,
    fieldKey: "",
    fieldLabel: "",
    fieldType: "TEXT",
    placeholder: "",
    helperText: "",
    isRequired: false,
    sortOrder: 0,
    isEnabled: true,
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
            <Button onClick={() => create(form)} disabled={creating || !form.fieldKey || !form.fieldLabel}>{creating ? "Adding…" : "Add"}</Button>
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
        <Button onClick={() => onSave(form)} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
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
      </Tabs>
    </div>
  )
}
