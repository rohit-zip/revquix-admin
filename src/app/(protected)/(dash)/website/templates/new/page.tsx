"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCreateTemplate } from "@/features/website/api/website-admin.hooks"
import type { CreateTemplateRequest } from "@/features/website/api/website-admin.types"
import { Loader2, AlertCircle } from "lucide-react"

const TEMPLATE_TYPES = ["SINGLE_PAGE", "MULTI_PAGE"] as const

export default function NewTemplatePage() {
  const router = useRouter()
  const { mutate: createTemplate, isPending } = useCreateTemplate(() => router.push("/website/templates"))
  const [form, setForm] = useState<Partial<CreateTemplateRequest>>({
    name: "", slug: "", description: "", templateType: "SINGLE_PAGE",
    isFree: false, priceInrPaise: 29900, priceUsdCents: 399,
    yearlyDiscountPercent: 20, isFeatured: false, isActive: false, displayOrder: 10,
    contentSchema: {}, defaultLayout: [],
  })
  const [schemaJson, setSchemaJson] = useState("{}")
  const [schemaError, setSchemaError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const parsed = JSON.parse(schemaJson)
      createTemplate({ ...form, contentSchema: parsed } as CreateTemplateRequest)
    } catch {
      setSchemaError(true)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Template</h1>
        <p className="text-sm text-muted-foreground">Add metadata for a newly deployed template</p>
      </div>

      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            The React component code must be deployed to <code className="font-mono text-xs">revquix-sites</code> before activating this template.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Template Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="developer-dark-v1" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select value={form.templateType} onChange={(e) => setForm({ ...form, templateType: e.target.value as typeof form.templateType })} className="w-full rounded-lg border px-3 py-2.5 text-sm">
                {TEMPLATE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Preview URL</label>
            <input type="url" value={form.previewUrl || ""} onChange={(e) => setForm({ ...form, previewUrl: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="https://preview.revquix.com/..." />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Pricing</h3>
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setForm({ ...form, isFree: !form.isFree })} className={`relative h-6 w-11 rounded-full transition-colors ${form.isFree ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}>
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${form.isFree ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm">Free template (with watermark)</span>
          </div>
          {!form.isFree && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">INR (paise)</label>
                <input type="number" value={form.priceInrPaise} onChange={(e) => setForm({ ...form, priceInrPaise: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">USD (cents)</label>
                <input type="number" value={form.priceUsdCents} onChange={(e) => setForm({ ...form, priceUsdCents: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Yearly Discount %</label>
                <input type="number" min="0" max="50" value={form.yearlyDiscountPercent} onChange={(e) => setForm({ ...form, yearlyDiscountPercent: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Content Schema (JSON)</h3>
          <textarea
            value={schemaJson}
            onChange={(e) => { setSchemaJson(e.target.value); setSchemaError(false) }}
            className={`w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-xs ${schemaError ? "border-red-500" : ""}`}
            rows={8}
            placeholder='{ "sections": [...] }'
          />
          {schemaError && <p className="text-xs text-red-600">Invalid JSON</p>}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 font-semibold">Visibility</h3>
          <div className="flex gap-6">
            {[
              { key: "isActive" as const, label: "Active (visible in catalog)" },
              { key: "isFeatured" as const, label: "Featured (shown first)" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form[item.key]} onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })} className="h-4 w-4 rounded" />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/website/templates")} className="rounded-lg border px-4 py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Template
          </button>
        </div>
      </form>
    </div>
  )
}

