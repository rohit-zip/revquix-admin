"use client"

import { use, useState } from "react"
import { useAdminTemplate, useUpdateTemplate, useUpdateTemplatePricing, useToggleTemplate } from "@/features/website/api/website-admin.hooks"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2 } from "lucide-react"

export default function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = use(params)
  const { data: template, isLoading } = useAdminTemplate(templateId)
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTemplate(templateId)
  const { mutate: updatePricing, isPending: isUpdatingPricing } = useUpdateTemplatePricing(templateId)
  const { mutate: toggle, isPending: isToggling } = useToggleTemplate(templateId)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priceInr, setPriceInr] = useState(0)
  const [priceUsd, setPriceUsd] = useState(0)
  const [yearlyDiscount, setYearlyDiscount] = useState(20)
  const [initialized, setInitialized] = useState(false)
  // null = use server value; boolean = optimistic value while mutation is in-flight
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null)

  if (template && !initialized) {
    setName(template.name)
    setDescription(template.description || "")
    setPriceInr(template.priceInrPaise)
    setPriceUsd(template.priceUsdCents)
    setYearlyDiscount(template.yearlyDiscountPercent)
    setInitialized(true)
  }

  // While toggling show the optimistic flip; otherwise always reflect the server value
  const displayActive = isToggling && optimisticActive !== null ? optimisticActive : (template?.isActive ?? false)

  const handleToggle = () => {
    const next = !displayActive
    setOptimisticActive(next)
    toggle(undefined, {
      onSettled: () => setOptimisticActive(null),
    })
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!template) return <div className="py-20 text-center">Template not found</div>

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Template: {template.name}</h1>
        <div className="inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
          <Switch
            checked={displayActive}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
          {isToggling ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </span>
          ) : (
            <span className={displayActive ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {displayActive ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Template Details</h3>
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm" rows={2} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Slug: <code className="font-mono">{template.slug}</code></span>
            <span>·</span>
            <span>Type: {template.templateType.replace("_", " ")}</span>
            <span>·</span>
            <span>Usage: {template.usageCount} sites</span>
          </div>
          <button
            onClick={() => updateTemplate({ name, description })}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> Save Details
          </button>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold">Pricing</h3>
            <p className="text-xs text-muted-foreground">Price changes affect new subscriptions only</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">INR (paise)</label>
              <input type="number" value={priceInr} onChange={(e) => setPriceInr(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">₹{(priceInr / 100).toFixed(0)}/mo</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">USD (cents)</label>
              <input type="number" value={priceUsd} onChange={(e) => setPriceUsd(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">${(priceUsd / 100).toFixed(2)}/mo</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Yearly Discount %</label>
              <input type="number" min="0" max="50" value={yearlyDiscount} onChange={(e) => setYearlyDiscount(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
            </div>
          </div>
          <button
            onClick={() => updatePricing({ priceInrPaise: priceInr, priceUsdCents: priceUsd, yearlyDiscountPercent: yearlyDiscount })}
            disabled={isUpdatingPricing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isUpdatingPricing && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Pricing
          </button>
        </div>
      </div>
    </div>
  )
}

