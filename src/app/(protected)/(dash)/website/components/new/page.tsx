"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCreateComponent } from "@/features/website/api/website-admin.hooks"
import type { CreateComponentRequest, ComponentCategory } from "@/features/website/api/website-admin.types"
import { Switch } from "@/components/ui/switch"
import { Loader2, AlertCircle } from "lucide-react"

const CATEGORIES: ComponentCategory[] = ["HERO", "NAVIGATION", "CONTENT", "FORM", "FOOTER", "DECORATION", "ADVANCED"]

export default function NewComponentPage() {
  const router = useRouter()
  const { mutate: create, isPending } = useCreateComponent(() => router.push("/website/components"))
  const [form, setForm] = useState({
    name: "", slug: "", description: "", category: "CONTENT" as ComponentCategory,
    isFree: true, priceInrPaise: 0, priceUsdCents: 0, isActive: false, displayOrder: 10,
  })
  const [propsSchemaJson, setPropsSchemaJson] = useState("{}")
  const [defaultPropsJson, setDefaultPropsJson] = useState("{}")
  const [jsonError, setJsonError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const propsSchema = JSON.parse(propsSchemaJson)
      const defaultProps = JSON.parse(defaultPropsJson)
      create({ ...form, propsSchema, defaultProps } as CreateComponentRequest)
    } catch {
      setJsonError("Invalid JSON in schema or default props")
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Register New Component</h1>
        <p className="text-sm text-muted-foreground">Register a component that's already deployed in revquix-sites</p>
      </div>

      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            The component must be added to <code className="font-mono text-xs">COMPONENT_REGISTRY</code> in revquix-sites before activating it.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Component Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug (matches registry key)</label>
              <input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="hero-banner" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ComponentCategory })} className="w-full rounded-lg border px-3 py-2.5 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Pricing</h3>
          <div className="flex items-center gap-3 mb-2">
            <Switch
              checked={form.isFree}
              onCheckedChange={(checked) => setForm({ ...form, isFree: checked })}
            />
            <span className="text-sm">Free component</span>
          </div>
          {!form.isFree && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">INR (paise)</label>
                <input type="number" value={form.priceInrPaise} onChange={(e) => setForm({ ...form, priceInrPaise: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">USD (cents)</label>
                <input type="number" value={form.priceUsdCents} onChange={(e) => setForm({ ...form, priceUsdCents: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Props Schema (JSON)</h3>
          <textarea value={propsSchemaJson} onChange={(e) => { setPropsSchemaJson(e.target.value); setJsonError("") }} className="w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-xs" rows={6} placeholder='{ "title": "string", "items": "array" }' />
          <h3 className="font-semibold">Default Props (JSON)</h3>
          <textarea value={defaultPropsJson} onChange={(e) => { setDefaultPropsJson(e.target.value); setJsonError("") }} className="w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-xs" rows={6} placeholder='{ "title": "Hello World" }' />
          {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm">Active (visible in component picker)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/website/components")} className="rounded-lg border px-4 py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Register Component
          </button>
        </div>
      </form>
    </div>
  )
}

