/**
 * ─── PERMISSION FORM DIALOG ─────────────────────────────────────────────────
 *
 * Dialog for creating / editing a permission.
 */

"use client"

import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import type { PermissionResponse } from "@/features/admin/api/admin-access.types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const permissionSchema = z.object({
  permissionName: z
    .string()
    .min(1, "Permission name is required")
    .max(100, "Name must be 1–100 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Must be uppercase letters, digits, or underscores (e.g. READ_POSTS)",
    ),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must not exceed 50 characters"),
})

type PermissionFormValues = z.infer<typeof permissionSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface PermissionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, dialog enters "edit" mode */
  permission?: PermissionResponse | null
  isPending: boolean
  onSubmit: (data: PermissionFormValues) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
  isPending,
  onSubmit,
}: PermissionFormDialogProps) {
  const isEdit = !!permission

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { permissionName: "", description: "", category: "" },
  })

  // Reset when dialog opens / permission changes
  useEffect(() => {
    if (open) {
      if (permission) {
        reset({
          permissionName: permission.permissionName,
          description: permission.description ?? "",
          category: permission.category ?? "",
        })
      } else {
        reset({ permissionName: "", description: "", category: "" })
      }
    }
  }, [open, permission, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Permission" : "Create Permission"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the permission details."
              : "Create a new permission that can be assigned to roles."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="perm-name">Name</Label>
            <Input
              id="perm-name"
              placeholder="e.g. READ_REPORTS"
              {...register("permissionName")}
              aria-invalid={!!errors.permissionName}
              disabled={isEdit}
            />
            {errors.permissionName && (
              <p className="text-xs text-destructive">{errors.permissionName.message}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Permission names cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="perm-category">Category</Label>
            <Input
              id="perm-category"
              placeholder="e.g. system, user, post"
              {...register("category")}
              aria-invalid={!!errors.category}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="perm-description">Description</Label>
            <Input
              id="perm-description"
              placeholder="Optional description…"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
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
              {isEdit ? "Save Changes" : "Create Permission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

