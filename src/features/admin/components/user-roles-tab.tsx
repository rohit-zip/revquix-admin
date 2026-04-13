/**
 * ─── USER ROLES TAB ──────────────────────────────────────────────────────────
 *
 * Displays the current roles assigned to a user and provides
 * controls to assign new roles or remove existing ones.
 *
 * Required authority: PERM_MANAGE_ROLES
 */

"use client"

import React, { useState } from "react"
import { Shield, Plus, Trash2, Loader2, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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

import { useRoles } from "@/features/admin/api/admin-access.hooks"
import { useAssignRole, useRemoveRole } from "@/features/admin/api/admin-user.hooks"
import type { RoleResponse } from "@/features/admin/api/admin-access.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleDisplayName(role: string): string {
  return role
    .replace("ROLE_", "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserRolesTabProps {
  userId: string
  /** Current role names from AdminUserResponse (e.g. ["ROLE_USER", "ROLE_ADMIN"]) */
  userRoles: string[]
  /** Whether the user data is still loading */
  isLoading?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserRolesTab({ userId, userRoles, isLoading }: UserRolesTabProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [removeTarget, setRemoveTarget] = useState<{ roleId: string; name: string } | null>(null)

  // ── All available roles ───────────────────────────────────────────────────
  const { data: rolesPage, isLoading: rolesLoading } = useRoles()
  const allRoles: RoleResponse[] = rolesPage?.content ?? []

  // ── Mutations ─────────────────────────────────────────────────────────────
  const assignRole = useAssignRole(userId, () => {
    setAssignDialogOpen(false)
    setSelectedRoleId("")
  })

  const removeRole = useRemoveRole(userId, () => {
    setRemoveTarget(null)
  })

  // ── Derive which roles can still be assigned ──────────────────────────────
  const assignableRoles = allRoles.filter(
    (role) => !userRoles.includes(role.name),
  )

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-5" />
              Assigned Roles
            </CardTitle>
            <CardDescription className="mt-1">
              {userRoles.length} role{userRoles.length !== 1 ? "s" : ""} assigned to this user
            </CardDescription>
          </div>

          {/* Assign Role Dialog */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" disabled={rolesLoading}>
                <Plus className="size-4" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role</DialogTitle>
                <DialogDescription>
                  Select a role to assign to this user. The role&apos;s permissions
                  will be immediately effective.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        All roles are already assigned
                      </div>
                    ) : (
                      assignableRoles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          <div className="flex flex-col">
                            <span>{roleDisplayName(role.name)}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">
                                {role.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => assignRole.mutate(selectedRoleId)}
                  disabled={!selectedRoleId || assignRole.isPending}
                >
                  {assignRole.isPending && (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  )}
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {userRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No roles assigned to this user.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Permissions</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((roleName) => {
                    const roleData = allRoles.find((r) => r.name === roleName)
                    const roleId = roleData?.roleId
                    return (
                      <TableRow key={roleName}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="size-4 text-muted-foreground" />
                            <span className="font-medium">
                              {roleDisplayName(roleName)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {roleData?.description ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs">
                                  {roleData?.permissions.length ?? 0} permissions
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                {roleData?.permissions.length ? (
                                  <div className="space-y-0.5">
                                    {roleData.permissions.map((p) => (
                                      <div key={p.permissionId} className="text-xs">
                                        {p.name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs">No permissions</span>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {roleData?.isSystemRole ? (
                            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                              System
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:text-destructive"
                                  disabled={!roleId || removeRole.isPending}
                                  onClick={() => {
                                    if (roleId) {
                                      setRemoveTarget({ roleId, name: roleName })
                                    }
                                  }}
                                >
                                  {removeRole.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove role</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Role Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the{" "}
              <strong>{removeTarget ? roleDisplayName(removeTarget.name) : ""}</strong>{" "}
              role from this user? All permissions granted through this role will
              be revoked immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) {
                  removeRole.mutate(removeTarget.roleId)
                }
              }}
              disabled={removeRole.isPending}
            >
              {removeRole.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}



