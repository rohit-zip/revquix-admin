"use client"

import Link from "next/link"
import { useState } from "react"
import { useAdminTemplates, useToggleTemplate } from "@/features/website/api/website-admin.hooks"
import type { AdminTemplateResponse } from "@/features/website/api/website-admin.types"
import { Plus, Loader2, Edit2, Users } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function AdminTemplatesPage() {
  const { data: templates, isLoading } = useAdminTemplates()

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">Manage website templates, pricing, and availability</p>
        </div>
        <Link href="/website/templates/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Template
        </Link>
      </div>

      <div className="rounded-xl border">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>Template</span>
          <span className="px-4">Type</span>
          <span className="px-4">Price (INR)</span>
          <span className="px-4">Usage</span>
          <span className="px-4">Active</span>
        </div>
        <div className="divide-y">
          {(templates || []).map((t) => (
            <TemplateRow key={t.templateId} template={t} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplateRow({ template }: { template: AdminTemplateResponse }) {
  const { mutate: toggle, isPending } = useToggleTemplate(template.templateId)
  const [optimisticActive, setOptimisticActive] = useState(template.isActive)

  const handleToggle = () => {
    setOptimisticActive((prev) => !prev)
    toggle(undefined, {
      onError: () => setOptimisticActive(template.isActive),
    })
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3">
      <div className="flex items-center gap-3">
        {template.thumbnailUrl ? (
          <img src={template.thumbnailUrl} alt={template.name} className="h-10 w-16 rounded object-cover" />
        ) : (
          <div className="h-10 w-16 rounded bg-muted" />
        )}
        <div>
          <p className="font-medium text-sm">{template.name}</p>
          <p className="text-xs text-muted-foreground">{template.slug}</p>
        </div>
      </div>
      <span className="px-4 text-xs text-muted-foreground">{template.templateType.replace("_", " ")}</span>
      <span className="px-4 text-sm">{template.isFree ? "Free" : `₹${(template.priceInrPaise / 100).toFixed(0)}`}</span>
      <div className="px-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {template.usageCount}
      </div>
      <div className="px-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={optimisticActive}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <Link href={`/website/templates/${template.templateId}`} className="rounded p-1 hover:bg-muted">
          <Edit2 className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}

