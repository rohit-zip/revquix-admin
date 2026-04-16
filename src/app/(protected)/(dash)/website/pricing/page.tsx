"use client"

import { useState } from "react"
import { usePlatformPricing, useUpdatePlatformPricing } from "@/features/website/api/website-admin.hooks"
import { Loader2, Save } from "lucide-react"

export default function PlatformPricingPage() {
  const { data: pricing, isLoading } = usePlatformPricing()
  const { mutate: update, isPending } = useUpdatePlatformPricing()

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Platform Pricing</h1>
        <p className="text-sm text-muted-foreground">Configure add-on prices. Changes take effect on next purchase.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(pricing || []).map((item) => (
          <PricingCard key={item.pricingKey} item={item} onSave={(priceInrPaise, priceUsdCents, isEnabled) =>
            update({ key: item.pricingKey, request: { priceInrPaise, priceUsdCents, isEnabled } })
          } />
        ))}
      </div>
    </div>
  )
}

function PricingCard({
  item,
  onSave,
}: {
  item: { pricingKey: string; displayName: string; description: string; priceInrPaise: number; priceUsdCents: number; isEnabled: boolean }
  onSave: (inr: number, usd: number, enabled: boolean) => void
}) {
  const [inr, setInr] = useState(item.priceInrPaise)
  const [usd, setUsd] = useState(item.priceUsdCents)
  const [enabled, setEnabled] = useState(item.isEnabled)

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{item.displayName}</h3>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">INR (paise)</label>
          <input type="number" value={inr} onChange={(e) => setInr(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-muted-foreground">₹{(inr / 100).toFixed(0)}/mo</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">USD (cents)</label>
          <input type="number" value={usd} onChange={(e) => setUsd(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-muted-foreground">${(usd / 100).toFixed(2)}/mo</p>
        </div>
      </div>

      <button
        onClick={() => onSave(inr, usd, enabled)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
      >
        <Save className="h-3.5 w-3.5" /> Save
      </button>
    </div>
  )
}

