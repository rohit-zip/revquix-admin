"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import {
  useAdminComponent,
  useUpdateComponent,
  useToggleComponent,
} from "@/features/website/api/website-admin.hooks"
import type { ComponentCategory } from "@/features/website/api/website-admin.types"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

const CATEGORIES: ComponentCategory[] = [
  "HERO",
  "NAVIGATION",
  "CONTENT",
  "FORM",
  "FOOTER",
  "DECORATION",
  "ADVANCED",
]

export default function EditComponentPage({
  params,
}: {
  params: Promise<{ componentId: string }>
}) {
  const { componentId } = use(params)
  const router = useRouter()
  const { data: component, isLoading } = useAdminComponent(componentId)
  const { mutate: updateComponent, isPending: isUpdating } = useUpdateComponent(componentId)
  const { mutate: toggle, isPending: isToggling } = useToggleComponent(componentId)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ComponentCategory>("CONTENT")
  const [isFree, setIsFree] = useState(true)
  const [priceInr, setPriceInr] = useState(0)
  const [priceUsd, setPriceUsd] = useState(0)
  const [displayOrder, setDisplayOrder] = useState(0)
  const [propsSchemaJson, setPropsSchemaJson] = useState("{}")
  const [defaultPropsJson, setDefaultPropsJson] = useState("{}")
  const [jsonError, setJsonError] = useState("")
  const [initialized, setInitialized] = useState(false)
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null)

  if (component && !initialized) {
    setName(component.name)
    setDescription(component.description || "")
    setCategory(component.category)
    setIsFree(component.isFree)
    setPriceInr(component.priceInrPaise)
    setPriceUsd(component.priceUsdCents)
    setDisplayOrder(component.displayOrder)
    setPropsSchemaJson(
      component.propsSchema ? JSON.stringify(component.propsSchema, null, 2) : "{}"
    )
    setDefaultPropsJson(
      component.defaultProps ? JSON.stringify(component.defaultProps, null, 2) : "{}"
    )
    setInitialized(true)
  }

  const displayActive =
    isToggling && optimisticActive !== null
      ? optimisticActive
      : (component?.isActive ?? false)

  const handleToggle = () => {
    const next = !displayActive
    setOptimisticActive(next)
    toggle(undefined, {
      onSettled: () => setOptimisticActive(null),
    })
  }

  const handleSave = () => {
    try {
      const propsSchema = JSON.parse(propsSchemaJson)
      const defaultProps = JSON.parse(defaultPropsJson)
      setJsonError("")
      updateComponent({
        name,
        slug: component.slug,
        description,
        category,
        isFree,
        priceInrPaise: priceInr,
        priceUsdCents: priceUsd,
        displayOrder,
        propsSchema,
        defaultProps,
      })
    } catch {
      setJsonError("Invalid JSON in schema or default props")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!component) {
    return <div className="py-20 text-center text-muted-foreground">Component not found</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/website/components"
            className="rounded-lg border p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit Component: {component.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Slug: <code className="font-mono">{component.slug}</code>
              {component.usageCount !== undefined && (
                <>
                  <span className="mx-1.5">·</span>
                  Usage: {component.usageCount} sites
                </>
              )}
            </p>
          </div>
        </div>
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
            <span
              className={
                displayActive
                  ? "font-medium text-green-600"
                  : "text-muted-foreground"
              }
            >
              {displayActive ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Component Details */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Component Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="w-full max-w-30 rounded-lg border px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Pricing</h3>
          <div className="flex items-center gap-3 mb-2">
            <Switch
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked)}
            />
            <span className="text-sm">Free component</span>
          </div>
          {!isFree && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">INR (paise)</label>
                <input
                  type="number"
                  value={priceInr}
                  onChange={(e) => setPriceInr(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  ₹{(priceInr / 100).toFixed(0)}/mo
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">USD (cents)</label>
                <input
                  type="number"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  ${(priceUsd / 100).toFixed(2)}/mo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Props Schema & Default Props */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Props Schema (JSON)</h3>
          <textarea
            value={propsSchemaJson}
            onChange={(e) => {
              setPropsSchemaJson(e.target.value)
              setJsonError("")
            }}
            className="w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-xs"
            rows={6}
          />
          <h3 className="font-semibold">Default Props (JSON)</h3>
          <textarea
            value={defaultPropsJson}
            onChange={(e) => {
              setDefaultPropsJson(e.target.value)
              setJsonError("")
            }}
            className="w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-xs"
            rows={6}
          />
          {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/website/components")}
            className="rounded-lg border px-4 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}


