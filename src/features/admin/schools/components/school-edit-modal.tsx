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
import { useUpdateAdminSchool } from "@/features/admin/schools/school.hooks"
import type { AdminSchoolResponse } from "@/features/admin/schools/school.types"
import { SchoolLogo } from "./school-logo"

// ─── Props ────────────────────────────────────────────────────────────────────

interface SchoolEditModalProps {
  school: AdminSchoolResponse | null
  open: boolean
  onClose: () => void
  onUpdated?: () => void
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  shortName: string
  domain: string
  logoUrl: string
  websiteUrl: string
  city: string
  country: string
  isVerified: boolean
  isActive: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SchoolEditModal({ school, open, onClose, onUpdated }: SchoolEditModalProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    shortName: "",
    domain: "",
    logoUrl: "",
    websiteUrl: "",
    city: "",
    country: "India",
    isVerified: false,
    isActive: true,
  })
  const [nameError, setNameError] = useState<string | null>(null)

  const update = useUpdateAdminSchool(() => { onClose(); onUpdated?.() })

  useEffect(() => {
    if (school && open) {
      setForm({
        name:       school.name,
        shortName:  school.shortName  ?? "",
        domain:     school.domain     ?? "",
        logoUrl:    school.logoUrl    ?? "",
        websiteUrl: school.websiteUrl ?? "",
        city:       school.city       ?? "",
        country:    school.country    ?? "India",
        isVerified: school.isVerified,
        isActive:   school.isActive,
      })
      setNameError(null)
    }
  }, [school, open])

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.name.trim()) { setNameError("School name is required"); return }
    if (!school) return
    setNameError(null)
    update.mutate({
      schoolId: school.schoolId,
      data: {
        name:       form.name.trim(),
        shortName:  form.shortName.trim()  || null,
        domain:     form.domain.trim()     || null,
        logoUrl:    form.logoUrl.trim()    || null,
        websiteUrl: form.websiteUrl.trim() || null,
        city:       form.city.trim()       || null,
        country:    form.country.trim()    || null,
        isVerified: form.isVerified,
        isActive:   form.isActive,
      },
    })
  }

  // Live preview data (uses unsaved form values)
  const previewSchool = {
    name:    form.name    || school?.name    || "",
    logoUrl: form.logoUrl || null,
    domain:  form.domain  || null,
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit School</DialogTitle>
          <DialogDescription>
            Update school details. Changes affect all users who referenced this institution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>School / University Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => { set("name", e.target.value); setNameError(null) }}
              placeholder="e.g. Indian Institute of Technology Bombay"
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Short Name */}
          <div className="space-y-1.5">
            <Label>Short Name / Abbreviation</Label>
            <Input
              value={form.shortName}
              onChange={(e) => set("shortName", e.target.value)}
              placeholder="e.g. IIT Bombay"
            />
            <p className="text-xs text-muted-foreground">
              Shown alongside the full name in autocomplete for faster recognition.
            </p>
          </div>

          {/* Domain + Website row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input
                value={form.domain}
                onChange={(e) => set("domain", e.target.value)}
                placeholder="e.g. iitb.ac.in"
              />
              <p className="text-xs text-muted-foreground">Used for Clearbit logo.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Website URL</Label>
              <Input
                value={form.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder="https://www.iitb.ac.in"
              />
            </div>
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
              <SchoolLogo school={previewSchool} size="sm" />
              <span className="text-xs text-muted-foreground">Logo preview</span>
            </div>
          )}

          {/* City + Country row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="e.g. India"
              />
            </div>
          </div>

          {/* Verified toggle */}
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Verified</p>
              <p className="text-xs text-muted-foreground">
                Mark this institution as admin-verified. Shows a verified badge in autocomplete.
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
                Inactive schools are hidden from autocomplete results.
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
            {update.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
