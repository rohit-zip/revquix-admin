/**
 * ─── ADMIN OFFER SERVICES VIEW ───────────────────────────────────────────────
 *
 * Paginated, filterable list of all offer services with inline create.
 * Route: /offer-services
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  Eye,
  Package,
  PlusCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

import { adminSearchOfferServices } from "./api/offer-service.api"
import {
  useAdminCreateOfferService,
} from "./api/offer-service.hooks"
import type { CreateOfferServiceRequest, OfferServiceResponse } from "./api/offer-service.types"
import { OFFER_SERVICE_CATEGORY_OPTIONS } from "./api/offer-service.types"

// ─── Filter config ─────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig = {
  searchableFields: ["displayName", "slug"],
  filterFields: [
    {
      field: "isEnabled",
      label: "Enabled",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" },
      ],
    },
    {
      field: "isDraft",
      label: "Draft",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Draft", value: "true" },
        { label: "Published", value: "false" },
      ],
    },
    {
      field: "serviceCategory",
      label: "Category",
      type: "STRING",
      operators: ["EQUALS"],
      options: OFFER_SERVICE_CATEGORY_OPTIONS,
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Created Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "sortOrder", label: "Sort Order" },
    { field: "displayName", label: "Name" },
    { field: "createdAt", label: "Created Date" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "sortOrder", direction: "ASC" }],
  defaultPageSize: 20,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<OfferServiceResponse>[] = [
  { key: "displayName", header: "Service Name", sortable: true },
  { key: "slug", header: "Slug", sortable: false },
  { key: "serviceCategory", header: "Category", sortable: true },
  { key: "status", header: "Status", sortable: false },
  { key: "sortOrder", header: "Order", sortable: true },
  { key: "createdAt", header: "Created", sortable: true },
  { key: "actions", header: "", sortable: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Create Service Modal ─────────────────────────────────────────────────────

interface CreateServiceModalProps {
  open: boolean
  onClose: () => void
}

function CreateServiceModal({ open, onClose }: CreateServiceModalProps) {
  const [form, setForm] = useState<CreateOfferServiceRequest>({
    slug: "",
    displayName: "",
    shortDescription: "",
    longDescription: "",
    coverImageUrl: "",
    serviceCategory: "CAREER",
    isEnabled: false,
    isDraft: true,
    sortOrder: 0,
  })

  const { mutate: createService, isPending } = useAdminCreateOfferService(onClose)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createService({
      ...form,
      slug: form.slug.toLowerCase().trim(),
    })
  }

  const set = (key: keyof CreateOfferServiceRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Offer Service</DialogTitle>
            <DialogDescription>
              Add a new service to the Revquix offer catalogue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                  placeholder="Resume Optimisation"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="resume-optimisation"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shortDescription">Short Description *</Label>
              <Textarea
                id="shortDescription"
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="Brief description shown in listing pages"
                required
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="longDescription">Long Description</Label>
              <Textarea
                id="longDescription"
                value={form.longDescription ?? ""}
                onChange={(e) => set("longDescription", e.target.value)}
                placeholder="Detailed description shown on service page"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={form.serviceCategory}
                  onValueChange={(v) => set("serviceCategory", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_SERVICE_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => set("sortOrder", parseInt(e.target.value, 10))}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                value={form.coverImageUrl ?? ""}
                onChange={(e) => set("coverImageUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isEnabled"
                  checked={form.isEnabled ?? false}
                  onCheckedChange={(v) => set("isEnabled", v)}
                />
                <Label htmlFor="isEnabled">Enabled</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isDraft"
                  checked={form.isDraft ?? true}
                  onCheckedChange={(v) => set("isDraft", v)}
                />
                <Label htmlFor="isDraft">Draft</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function AdminOfferServicesView() {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const search = useGenericSearch<OfferServiceResponse>({
    queryKey: "admin-offer-services",
    searchFn: adminSearchOfferServices,
    config: FILTER_CONFIG,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Offer Service Catalogue
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all Global Offer Services, their plans, add-ons, and intake form fields.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(service) => (
          <TableRow
            key={service.serviceId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() =>
              router.push(`${PATH_CONSTANTS.ADMIN_OFFER_SERVICE_DETAIL}/${service.serviceId}`)
            }
          >
            <TableCell className="font-medium">
              <div>
                <p>{service.displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{service.shortDescription}</p>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {service.slug}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs capitalize">
                {service.serviceCategory.toLowerCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1.5 flex-wrap">
                {service.isEnabled ? (
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Disabled</Badge>
                )}
                {service.isDraft && (
                  <Badge variant="outline" className="text-xs">Draft</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">{service.sortOrder}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(service.createdAt)}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(
                    `${PATH_CONSTANTS.ADMIN_OFFER_SERVICE_DETAIL}/${service.serviceId}`,
                  )
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        )}
      />

      <CreateServiceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
