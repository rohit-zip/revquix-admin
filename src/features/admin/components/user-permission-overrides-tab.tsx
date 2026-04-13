/**
 * ─── USER PERMISSION OVERRIDES TAB ───────────────────────────────────────────
 *
 * Displays per-user permission overrides (GRANT / DENY) and provides
 * controls to add new overrides or remove existing ones.
 *
 * Required authority: PERM_MANAGE_USER_ROLES
 */

"use client"

import React, { useCallback, useState } from "react"
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  Clock,
  CalendarIcon,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { usePermissions } from "@/features/admin/api/admin-access.hooks"
import {
  useUserOverrides,
  useGrantPermission,
  useDenyPermission,
  useRemoveOverride,
} from "@/features/admin/api/admin-user.hooks"
import type { UserPermissionOverrideResponse } from "@/features/admin/api/admin-user.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserPermissionOverridesTabProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserPermissionOverridesTab({ userId }: UserPermissionOverridesTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [overrideType, setOverrideType] = useState<"GRANT" | "DENY">("GRANT")
  const [selectedPermissionId, setSelectedPermissionId] = useState("")
  const [reason, setReason] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [removeTarget, setRemoveTarget] = useState<UserPermissionOverrideResponse | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: overrides, isLoading: overridesLoading } = useUserOverrides(userId)
  const { data: permissionsPage, isLoading: permissionsLoading } = usePermissions()
  const allPermissions = permissionsPage?.content ?? []

  const resetForm = useCallback(() => {
    setAddDialogOpen(false)
    setSelectedPermissionId("")
    setReason("")
    setExpiresAt("")
    setOverrideType("GRANT")
  }, [])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const grantPermission = useGrantPermission(userId, resetForm)
  const denyPermission = useDenyPermission(userId, resetForm)
  const removeOverride = useRemoveOverride(userId, () => setRemoveTarget(null))

  function handleSubmit() {
    const data = {
      permissionId: selectedPermissionId,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      reason: reason.trim() || null,
    }

    if (overrideType === "GRANT") {
      grantPermission.mutate(data)
    } else {
      denyPermission.mutate(data)
    }
  }

  const isPending = grantPermission.isPending || denyPermission.isPending

  // ── Loading state ─────────────────────────────────────────────────────────
  if (overridesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  // ── Separate active and expired overrides ─────────────────────────────────
  const activeOverrides = (overrides ?? []).filter((o) => !isExpired(o.expiresAt))
  const expiredOverrides = (overrides ?? []).filter((o) => isExpired(o.expiresAt))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="size-5" />
              Permission Overrides
            </CardTitle>
            <CardDescription className="mt-1">
              {(overrides ?? []).length} override{(overrides ?? []).length !== 1 ? "s" : ""} —
              direct GRANT or DENY that bypass role-inherited permissions
            </CardDescription>
          </div>

          {/* Add Override Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" disabled={permissionsLoading}>
                <Plus className="size-4" />
                Add Override
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Permission Override</DialogTitle>
                <DialogDescription>
                  Grant or deny a specific permission directly to this user,
                  bypassing their role assignments.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Override Type */}
                <div className="space-y-2">
                  <Label>Override Type</Label>
                  <Select
                    value={overrideType}
                    onValueChange={(v) => setOverrideType(v as "GRANT" | "DENY")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRANT">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-emerald-500" />
                          <span>Grant — allow this permission</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DENY">
                        <div className="flex items-center gap-2">
                          <ShieldX className="size-4 text-destructive" />
                          <span>Deny — block this permission</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Permission Selection */}
                <div className="space-y-2">
                  <Label>Permission</Label>
                  <Select
                    value={selectedPermissionId}
                    onValueChange={setSelectedPermissionId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a permission..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allPermissions.map((perm) => (
                        <SelectItem key={perm.permissionId} value={perm.permissionId}>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{perm.permissionName}</span>
                            {perm.description && (
                              <span className="text-xs text-muted-foreground">
                                {perm.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiry (optional) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5" />
                    Expires At
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* Reason (optional) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Reason
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="e.g. Temporary access for special project"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedPermissionId || isPending}
                  variant={overrideType === "DENY" ? "destructive" : "default"}
                >
                  {isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  {overrideType === "GRANT" ? "Grant Permission" : "Deny Permission"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {(overrides ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No permission overrides for this user.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All permissions are inherited from assigned roles.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active overrides */}
              {activeOverrides.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Active Overrides ({activeOverrides.length})
                  </h4>
                  <OverridesTable
                    overrides={activeOverrides}
                    onRemove={setRemoveTarget}
                    isRemoving={removeOverride.isPending}
                  />
                </div>
              )}

              {/* Expired overrides */}
              {expiredOverrides.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Expired Overrides ({expiredOverrides.length})
                  </h4>
                  <OverridesTable
                    overrides={expiredOverrides}
                    onRemove={setRemoveTarget}
                    isRemoving={removeOverride.isPending}
                    isExpiredSection
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Override Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Override</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the{" "}
              <strong>{removeTarget?.grantType}</strong> override for{" "}
              <strong className="font-mono">{removeTarget?.permissionName}</strong>?
              The user will fall back to role-inherited permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) {
                  removeOverride.mutate(removeTarget.permissionId)
                }
              }}
              disabled={removeOverride.isPending}
            >
              {removeOverride.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Sub-component: Overrides Table ──────────────────────────────────────────

function OverridesTable({
  overrides,
  onRemove,
  isRemoving,
  isExpiredSection = false,
}: {
  overrides: UserPermissionOverrideResponse[]
  onRemove: (override: UserPermissionOverrideResponse) => void
  isRemoving: boolean
  isExpiredSection?: boolean
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden md:table-cell">Reason</TableHead>
            <TableHead className="hidden md:table-cell">Expires</TableHead>
            <TableHead className="hidden lg:table-cell">Created</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overrides.map((override) => (
            <TableRow
              key={override.overrideId}
              className={isExpiredSection ? "opacity-60" : undefined}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-muted-foreground" />
                  <span className="font-mono text-xs font-medium">
                    {override.permissionName}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {override.grantType === "GRANT" ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  >
                    <ShieldCheck className="size-3" />
                    Grant
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <ShieldX className="size-3" />
                    Deny
                  </Badge>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-50">
                <span className="text-xs text-muted-foreground truncate block">
                  {override.reason ?? "—"}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {override.expiresAt ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground" />
                          <span
                            className={`text-xs ${
                              isExpired(override.expiresAt)
                                ? "text-destructive line-through"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatDateTime(override.expiresAt)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isExpired(override.expiresAt) ? "Expired" : "Active until this date"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-xs text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(override.createdAt)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={isRemoving}
                        onClick={() => onRemove(override)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove override</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}





