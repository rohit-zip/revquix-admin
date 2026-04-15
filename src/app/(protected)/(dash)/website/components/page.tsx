"use client"

import { useState } from "react"
import Link from "next/link"
import { useAdminComponents, useToggleComponent } from "@/features/website/api/website-admin.hooks"
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2, Edit2, Users } from "lucide-react"

export default function AdminComponentsPage() {
  const { data: components, isLoading } = useAdminComponents()

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  const byCategory: Record<string, typeof components> = {}
  for (const c of (components || [])) {
    const cat = c.category || "OTHER"
    byCategory[cat] = [...(byCategory[cat] || []), c]
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Components</h1>
          <p className="text-sm text-muted-foreground">Manage website components and their pricing</p>
        </div>
        <Link href="/website/components/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Component
        </Link>
      </div>

      <div className="space-y-6">
        {Object.entries(byCategory).map(([category, comps]) => (
          <div key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{category}</h2>
            <div className="rounded-xl border">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                <span>Component</span>
                <span className="px-4">Slug</span>
                <span className="px-4">Price (INR)</span>
                <span className="px-4">Usage</span>
                <span className="px-4">Active</span>
              </div>
              <div className="divide-y">
                {(comps || []).map((comp) => (
                  <ComponentRow key={comp.componentId} component={comp} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComponentRow({ component }: { component: { componentId: string; name: string; slug: string; isFree: boolean; priceInrPaise: number; isActive: boolean; usageCount: number } }) {
  const { mutate: toggle, isPending } = useToggleComponent(component.componentId)
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null)

  const displayActive = isPending && optimisticActive !== null ? optimisticActive : (component.isActive ?? false)

  const handleToggle = () => {
    const next = !displayActive
    setOptimisticActive(next)
    toggle(undefined, {
      onSettled: () => setOptimisticActive(null),
    })
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3">
      <span className="text-sm font-medium">{component.name}</span>
      <span className="px-4 font-mono text-xs text-muted-foreground">{component.slug}</span>
      <span className="px-4 text-sm">{component.isFree ? "Free" : `₹${(component.priceInrPaise / 100).toFixed(0)}`}</span>
      <div className="px-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> {component.usageCount}
      </div>
      <div className="px-4 flex items-center gap-2">
        <Switch
          checked={displayActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
          size="sm"
        />
        <Link href={`/website/components/${component.componentId}`} className="rounded p-1 hover:bg-muted">
          <Edit2 className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}

