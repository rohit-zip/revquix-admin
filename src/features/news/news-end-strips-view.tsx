"use client"

import { useState } from "react"
import Link from "next/link"
import { ImageIcon, PanelBottom, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  useCreateEndStrip,
  useDeleteEndStrip,
  useEndStripTemplates,
  useUpdateEndStrip,
} from "./api/news.hooks"
import {
  END_STRIP_THEME_OPTIONS,
  END_STRIP_VARIANT_OPTIONS,
  type EndStripTemplate,
  type EndStripTemplateRequest,
  type EndStripThemeMode,
  type EndStripVariant,
} from "./api/news.types"

const EMPTY: EndStripTemplateRequest = {
  name: "",
  variant: "GRADIENT_AVATARS",
  themeMode: "ADAPTIVE",
  accentToken: "",
  defaultTitle: "",
  defaultDescription: "",
  supportsAvatars: false,
  isActive: true,
}

const VARIANT_LABEL: Record<EndStripVariant, string> = {
  GRADIENT_AVATARS: "Gradient + avatars",
  SOLID_MINIMAL: "Solid minimal",
  IMAGE_BG: "Image background",
  BORDERED_CARD: "Bordered card",
}

export function NewsEndStripsView() {
  const { data: strips, isLoading } = useEndStripTemplates()
  const create = useCreateEndStrip()
  const update = useUpdateEndStrip()
  const del = useDeleteEndStrip()

  const [editing, setEditing] = useState<EndStripTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<EndStripTemplateRequest>(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState<EndStripTemplate | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }
  const openEdit = (s: EndStripTemplate) => {
    setEditing(s)
    setForm({
      name: s.name,
      variant: s.variant,
      themeMode: s.themeMode,
      accentToken: s.accentToken ?? "",
      defaultTitle: s.defaultTitle ?? "",
      defaultDescription: s.defaultDescription ?? "",
      supportsAvatars: s.supportsAvatars,
      isActive: s.isActive,
    })
    setDialogOpen(true)
  }

  const onSubmit = () => {
    if (!form.name.trim()) return
    if (editing) {
      update.mutate(
        { stripId: editing.stripId, request: form },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      create.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <PanelBottom className="h-5 w-5" /> End-strip templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Reusable closing call-to-action strips. Token-styled and light/dark safe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1.5">
            <Link href={PATH_CONSTANTS.ADMIN_ASSETS}>
              <ImageIcon className="h-4 w-4" /> Asset Manager
            </Link>
          </Button>
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !strips || strips.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No end-strip templates yet. For image backgrounds, grab URLs from the Asset Manager.
        </div>
      ) : (
        <div className="rounded-lg ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Avatars</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strips.map((s) => (
                <TableRow key={s.stripId}>
                  <TableCell className="font-medium">
                    {s.name}
                    {s.defaultTitle && (
                      <p className="max-w-md truncate text-xs font-normal text-muted-foreground">
                        {s.defaultTitle}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{VARIANT_LABEL[s.variant]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.themeMode}</TableCell>
                  <TableCell>{s.supportsAvatars ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit template" : "New end-strip template"}</DialogTitle>
            <DialogDescription>
              Defaults can be overridden per article in the curation panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="strip-name">Name</Label>
              <Input
                id="strip-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Newsletter CTA"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Variant</Label>
                <Select
                  value={form.variant ?? "GRADIENT_AVATARS"}
                  onValueChange={(v) => setForm((f) => ({ ...f, variant: v as EndStripVariant }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {END_STRIP_VARIANT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Theme mode</Label>
                <Select
                  value={form.themeMode ?? "ADAPTIVE"}
                  onValueChange={(v) => setForm((f) => ({ ...f, themeMode: v as EndStripThemeMode }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {END_STRIP_THEME_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="strip-accent">Accent token</Label>
              <Input
                id="strip-accent"
                value={form.accentToken ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, accentToken: e.target.value }))}
                placeholder="e.g. primary, brand-emerald"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="strip-title">Default title</Label>
              <Input
                id="strip-title"
                value={form.defaultTitle ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, defaultTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="strip-desc">Default description</Label>
              <Textarea
                id="strip-desc"
                value={form.defaultDescription ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, defaultDescription: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="strip-avatars">Supports avatars</Label>
              <Switch
                id="strip-avatars"
                checked={form.supportsAvatars ?? false}
                onCheckedChange={(v) => setForm((f) => ({ ...f, supportsAvatars: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="strip-active">Active</Label>
              <Switch
                id="strip-active"
                checked={form.isActive ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!form.name.trim() || create.isPending || update.isPending}
            >
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed. Articles using it fall back to no
              end strip. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) del.mutate(deleteTarget.stripId)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
