/**
 * ─── ROLE FORM DIALOG ────────────────────────────────────────────────────────
 *
 * Dialog for creating / editing a role.
 * Includes a multi-select permission picker populated from the permissions API.
 */

"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Search } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { RoleResponse } from "@/features/admin/api/admin-access.types"
import { usePermissions } from "@/features/admin/api/admin-access.hooks"

// ─── Schema ───────────────────────────────────────────────────────────────────

const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name must be 1–100 characters"),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
})

type RoleFormValues = z.infer<typeof roleSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, dialog enters "edit" mode */
  role?: RoleResponse | null
  isPending: boolean
  onSubmit: (data: { name: string; description?: string; permissionIds: string[] }) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoleFormDialog({
  open,
  onOpenChange,
  role,
  isPending,
  onSubmit,
}: RoleFormDialogProps) {
  const isEdit = !!role
  const { data: permissionsPage, isLoading: isLoadingPermissions } = usePermissions()
  const allPermissions = useMemo(() => permissionsPage?.content ?? [], [permissionsPage])

  // Selected permission IDs
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())
  const [permissionSearch, setPermissionSearch] = useState("")

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  })

  // Reset form when dialog opens / role changes
  useEffect(() => {
    if (open) {
      if (role) {
        reset({ name: role.name, description: role.description ?? "" })
      } else {
        reset({ name: "", description: "" })
      }
      setPermissionSearch("")
    }
  }, [open, role, reset])

  // Sync selected permissions separately to avoid setState-in-effect lint error
  useEffect(() => {
    if (open && role) {
      const ids = new Set(role.permissions.map((p) => p.permissionId))
      setSelectedPermissionIds(ids)
    } else if (open) {
      setSelectedPermissionIds(new Set())
    }
  }, [open, role])

  // Group permissions by category
  const grouped = useMemo(() => {
    const filtered = allPermissions.filter((p) =>
      p.permissionName.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(permissionSearch.toLowerCase()),
    )
    const map = new Map<string, typeof allPermissions>()
    for (const p of filtered) {
      const cat = p.category || "uncategorized"
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissions, permissionSearch])

  function togglePermission(id: string) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleFormSubmit(values: RoleFormValues) {
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      permissionIds: Array.from(selectedPermissionIds),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the role details and its assigned permissions."
              : "Create a new role and optionally assign permissions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              placeholder="e.g. MENTOR"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              placeholder="Optional description…"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Permission picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <Badge variant="secondary" className="text-xs">
                {selectedPermissionIds.size} selected
              </Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search permissions…"
                className="pl-8"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <ScrollArea className="h-52 rounded-md border">
              <div className="p-3 space-y-3">
                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : grouped.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No permissions found.
                  </p>
                ) : (
                  grouped.map(([category, perms], idx) => (
                    <div key={category}>
                      {idx > 0 && <Separator className="mb-3" />}
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {category}
                      </p>
                      <div className="space-y-1.5">
                        {perms.map((perm) => (
                          <label
                            key={perm.permissionId}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                          >
                            <Checkbox
                              checked={selectedPermissionIds.has(perm.permissionId)}
                              onCheckedChange={() => togglePermission(perm.permissionId)}
                            />
                            <span className="text-sm">{perm.permissionName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


