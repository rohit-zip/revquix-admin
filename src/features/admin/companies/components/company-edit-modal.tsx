"use client"

import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useUpdateAdminCompany } from "@/features/admin/companies/company.hooks"
import type { AdminCompanyResponse } from "@/features/admin/companies/company.types"

interface CompanyEditModalProps {
  company: AdminCompanyResponse | null
  open: boolean
  onClose: () => void
  onUpdated?: () => void
}

interface FormState {
  name: string
  domain: string
  logoUrl: string
  isVerified: boolean
  isActive: boolean
}

export function CompanyEditModal({ company, open, onClose, onUpdated }: CompanyEditModalProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    domain: "",
    logoUrl: "",
    isVerified: false,
    isActive: true,
  })
  const [nameError, setNameError] = useState<string | null>(null)

  const update = useUpdateAdminCompany(() => { onClose(); onUpdated?.() })

  useEffect(() => {
    if (company && open) {
      setForm({
        name: company.name,
        domain: company.domain ?? "",
        logoUrl: company.logoUrl ?? "",
        isVerified: company.isVerified,
        isActive: company.isActive,
      })
      setNameError(null)
    }
  }, [company, open])

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.name.trim()) { setNameError("Company name is required"); return }
    if (!company) return
    setNameError(null)
    update.mutate({
      companyId: company.companyId,
      data: {
        name: form.name.trim(),
        domain: form.domain.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        isVerified: form.isVerified,
        isActive: form.isActive,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update company details. Changes affect all users who referenced this company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Company Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => { set("name", e.target.value); setNameError(null) }}
              placeholder="e.g. Stripe"
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Domain */}
          <div className="space-y-1.5">
            <Label>Domain</Label>
            <Input
              value={form.domain}
              onChange={(e) => set("domain", e.target.value)}
              placeholder="e.g. stripe.com"
            />
            <p className="text-xs text-muted-foreground">
              Used for automatic logo resolution via Clearbit.
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://cdn.example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Admin-set URL takes priority over Clearbit.
            </p>
          </div>

          {/* Logo preview */}
          {(form.logoUrl || form.domain) && (
            <div className="flex items-center gap-3 rounded-md border border-border p-2">
              <LogoPreview name={form.name} logoUrl={form.logoUrl} domain={form.domain} />
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
          )}

          {/* Verified toggle */}
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Verified</p>
              <p className="text-xs text-muted-foreground">
                Mark this company as admin-verified. Shows a verified badge in autocomplete.
              </p>
            </div>
            <Switch
              checked={form.isVerified}
              onCheckedChange={(v) => set("isVerified", v)}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive companies are hidden from autocomplete results.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : "Save Changes"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Logo Preview ─────────────────────────────────────────────────────────────

function LogoPreview({
  name,
  logoUrl,
  domain,
}: {
  name: string
  logoUrl: string
  domain: string
}) {
  const src = logoUrl || (domain ? `https://logo.clearbit.com/${domain}` : null)
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-sm font-bold text-primary">
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-8 w-8 rounded object-contain"
      onError={() => setImgError(true)}
    />
  )
}
