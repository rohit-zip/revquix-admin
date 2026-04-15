"use client"

import { useState } from "react"
import { useWatermarkConfig, useUpdateWatermarkConfig } from "@/features/website/api/website-admin.hooks"
import { Save, Loader2, Eye } from "lucide-react"

export default function WatermarkConfigPage() {
  const { data: config, isLoading } = useWatermarkConfig()
  const { mutate: update, isPending } = useUpdateWatermarkConfig()
  const [form, setForm] = useState({ text: "", logoUrl: "", linkUrl: "", isActive: true })
  const [initialized, setInitialized] = useState(false)

  if (config && !initialized) {
    setForm({ text: config.text, logoUrl: config.logoUrl || "", linkUrl: config.linkUrl, isActive: config.isActive })
    setInitialized(true)
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Watermark Configuration</h1>
        <p className="text-sm text-muted-foreground">Configure the "Powered by Revquix" footer shown on free sites</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Watermark Enabled</h3>
            <button
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${form.isActive ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Watermark Text</label>
            <input type="text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Powered by Revquix" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Logo URL</label>
            <input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Link URL</label>
            <input type="url" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="https://www.revquix.com?ref=watermark" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Preview</span>
          </div>
          <div className="rounded-lg border bg-gray-50 py-3 px-4 text-center dark:bg-gray-900">
            <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {form.logoUrl && <img src={form.logoUrl} alt="" className="h-4 w-auto" />}
              {form.text || "Powered by Revquix"}
            </span>
          </div>
        </div>

        <button
          onClick={() => update(form)}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> Save Configuration
        </button>
      </div>
    </div>
  )
}

