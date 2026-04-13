/**
 * ─── ADMIN ROLES & PERMISSIONS VIEW ─────────────────────────────────────────
 *
 * Main view component for /admin/roles page.
 * Two tabs: Roles and Permissions, each with a table + CRUD dialogs.
 *
 * ── APIs NOT used on this page ──────────────────────────────────────────────
 * The following backend endpoints are available but NOT consumed here because
 * their functionality is redundant for this UI:
 *
 *  1. GET  /admin/roles/{roleId}         → getRole
 *     Reason: listRoles already returns full role details including permissions.
 *
 *  2. GET  /admin/permissions/{permId}   → getPermission
 *     Reason: listPermissions returns full details; no detail-view needed.
 *
 *  3. GET  /admin/permissions/category/{cat} → listPermissionsByCategory
 *     Reason: We fetch all permissions at once and filter/group client-side.
 *
 *  4. POST /admin/roles/{roleId}/permissions/{permId} → addPermissionToRole
 *     Reason: updateRole accepts the full permissionIds list, so we set
 *     all permissions in one call instead of toggling one-by-one.
 *
 *  5. DELETE /admin/roles/{roleId}/permissions/{permId} → removePermissionFromRole
 *     Reason: Same as above — updateRole replaces the entire permission set.
 *
 *  6. POST /admin/roles/{roleId}/users/{userId} → assignRoleToUser
 *     Reason: User ↔ role assignment belongs on the admin users page.
 *
 *  7. DELETE /admin/roles/{roleId}/users/{userId} → removeRoleFromUser
 *     Reason: Same as above.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"

import React, { useMemo, useState } from "react"
import {
  Shield,
  Key,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Lock,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuthorization } from "@/hooks/useAuthorization"

import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from "@/features/admin/api/admin-access.hooks"
import type { RoleResponse, PermissionResponse } from "@/features/admin/api/admin-access.types"

import RoleFormDialog from "@/features/admin/components/role-form-dialog"
import PermissionFormDialog from "@/features/admin/components/permission-form-dialog"
import DeleteConfirmDialog from "@/features/admin/components/delete-confirm-dialog"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function categoryColor(category: string): "default" | "secondary" | "outline" {
  switch (category.toLowerCase()) {
    case "admin":
    case "system":
      return "default"
    case "user":
      return "secondary"
    default:
      return "outline"
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminRolesPermissionsView() {
  const { hasAnyAuthority } = useAuthorization()
  const canManageRoles = hasAnyAuthority(["ROLE_ADMIN", "PERM_MANAGE_ROLES"])
  const canManagePermissions = hasAnyAuthority(["ROLE_ADMIN", "PERM_MANAGE_PERMISSIONS"])

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: rolesPage, isLoading: isLoadingRoles } = useRoles()
  const { data: permissionsPage, isLoading: isLoadingPermissions } = usePermissions()

  const roles = useMemo(() => rolesPage?.content ?? [], [rolesPage])
  const permissions = useMemo(() => permissionsPage?.content ?? [], [permissionsPage])

  // ── Role dialog state ───────────────────────────────────────────────────────
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null)

  // ── Permission dialog state ─────────────────────────────────────────────────
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [editingPerm, setEditingPerm] = useState<PermissionResponse | null>(null)

  // ── Delete dialog state ─────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "role" | "permission"
    id: string
    name: string
  } | null>(null)

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createRoleMutation = useCreateRole(() => setRoleDialogOpen(false))
  const updateRoleMutation = useUpdateRole(() => {
    setRoleDialogOpen(false)
    setEditingRole(null)
  })
  const deleteRoleMutation = useDeleteRole(() => setDeleteTarget(null))

  const createPermMutation = useCreatePermission(() => setPermDialogOpen(false))
  const updatePermMutation = useUpdatePermission(() => {
    setPermDialogOpen(false)
    setEditingPerm(null)
  })
  const deletePermMutation = useDeletePermission(() => setDeleteTarget(null))

  // ── Stats ───────────────────────────────────────────────────────────────────
  const roleStats = useMemo(() => {
    const systemCount = roles.filter((r) => r.isSystemRole).length
    return { total: roles.length, system: systemCount, custom: roles.length - systemCount }
  }, [roles])

  const permCategories = useMemo(() => {
    const cats = new Set(permissions.map((p) => p.category))
    return cats.size
  }, [permissions])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleRoleSubmit(data: { name: string; description?: string; permissionIds: string[] }) {
    if (editingRole) {
      updateRoleMutation.mutate({
        roleId: editingRole.roleId,
        data: { name: data.name, description: data.description, permissionIds: data.permissionIds },
      })
    } else {
      createRoleMutation.mutate({
        name: data.name,
        description: data.description,
        permissionIds: data.permissionIds,
      })
    }
  }

  function handlePermSubmit(data: { permissionName: string; description?: string; category: string }) {
    if (editingPerm) {
      updatePermMutation.mutate({
        permissionId: editingPerm.permissionId,
        data,
      })
    } else {
      createPermMutation.mutate(data)
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    if (deleteTarget.type === "role") {
      deleteRoleMutation.mutate(deleteTarget.id)
    } else {
      deletePermMutation.mutate(deleteTarget.id)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Access Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and permissions that control what users can do across the platform.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<Shield className="size-4" />}
            label="Total Roles"
            value={isLoadingRoles ? null : roleStats.total}
          />
          <StatsCard
            icon={<Lock className="size-4" />}
            label="System Roles"
            value={isLoadingRoles ? null : roleStats.system}
          />
          <StatsCard
            icon={<Key className="size-4" />}
            label="Total Permissions"
            value={isLoadingPermissions ? null : permissions.length}
          />
          <StatsCard
            icon={<Key className="size-4" />}
            label="Categories"
            value={isLoadingPermissions ? null : permCategories}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles" className="gap-1.5">
              <Shield className="size-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-1.5">
              <Key className="size-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* ═══ ROLES TAB ═══ */}
          <TabsContent value="roles">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roles</CardTitle>
                    <CardDescription>
                      Roles group permissions together and are assigned to users.
                    </CardDescription>
                  </div>
                  {canManageRoles && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingRole(null)
                        setRoleDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-1.5 size-4" />
                      New Role
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingRoles ? (
                  <TableSkeleton rows={4} cols={5} />
                ) : roles.length === 0 ? (
                  <EmptyState
                    icon={<Shield className="size-10 text-muted-foreground/50" />}
                    title="No roles found"
                    description="Create your first role to get started."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Permissions</TableHead>
                        <TableHead>Created</TableHead>
                        {canManageRoles && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.roleId}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell className="max-w-70 truncate text-muted-foreground">
                            {role.description || "—"}
                          </TableCell>
                          <TableCell>
                            {role.isSystemRole ? (
                              <Badge variant="default" className="gap-1 text-xs">
                                <Lock className="size-3" />
                                System
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="cursor-default text-xs">
                                  {role.permissions.length}
                                </Badge>
                              </TooltipTrigger>
                              {role.permissions.length > 0 && (
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p className="mb-1 text-xs font-medium">
                                    Assigned permissions:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {role.permissions.map((p) => (
                                      <span
                                        key={p.permissionId}
                                        className="inline-block rounded bg-foreground/10 px-1.5 py-0.5 text-xs"
                                      >
                                        {p.name}
                                      </span>
                                    ))}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(role.createdAt)}
                          </TableCell>
                          {canManageRoles && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-xs">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingRole(role)
                                      setRoleDialogOpen(true)
                                    }}
                                  >
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {!role.isSystemRole && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() =>
                                          setDeleteTarget({
                                            type: "role",
                                            id: role.roleId,
                                            name: role.name,
                                          })
                                        }
                                      >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PERMISSIONS TAB ═══ */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Permissions</CardTitle>
                    <CardDescription>
                      Fine-grained permissions that are assigned to roles.
                    </CardDescription>
                  </div>
                  {canManagePermissions && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingPerm(null)
                        setPermDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-1.5 size-4" />
                      New Permission
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingPermissions ? (
                  <TableSkeleton rows={6} cols={5} />
                ) : permissions.length === 0 ? (
                  <EmptyState
                    icon={<Key className="size-10 text-muted-foreground/50" />}
                    title="No permissions found"
                    description="Create your first permission to get started."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        {canManagePermissions && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((perm) => (
                        <TableRow key={perm.permissionId}>
                          <TableCell className="font-mono text-sm font-medium">
                            {perm.permissionName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={categoryColor(perm.category)} className="text-xs">
                              {perm.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[320px] truncate text-muted-foreground">
                            {perm.description || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(perm.createdAt)}
                          </TableCell>
                          {canManagePermissions && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-xs">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingPerm(perm)
                                      setPermDialogOpen(true)
                                    }}
                                  >
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "permission",
                                        id: perm.permissionId,
                                        name: perm.permissionName,
                                      })
                                    }
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Dialogs ──────────────────────────────────────────────────────── */}
        <RoleFormDialog
          open={roleDialogOpen}
          onOpenChange={(open) => {
            setRoleDialogOpen(open)
            if (!open) setEditingRole(null)
          }}
          role={editingRole}
          isPending={createRoleMutation.isPending || updateRoleMutation.isPending}
          onSubmit={handleRoleSubmit}
        />

        <PermissionFormDialog
          open={permDialogOpen}
          onOpenChange={(open) => {
            setPermDialogOpen(open)
            if (!open) setEditingPerm(null)
          }}
          permission={editingPerm}
          isPending={createPermMutation.isPending || updatePermMutation.isPending}
          onSubmit={handlePermSubmit}
        />

        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          title={`Delete ${deleteTarget?.type === "role" ? "Role" : "Permission"}`}
          description={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone. The operation will fail if it's still assigned to any ${deleteTarget.type === "role" ? "users" : "roles"}.`
              : ""
          }
          isPending={deleteRoleMutation.isPending || deletePermMutation.isPending}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </TooltipProvider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | null
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-5 w-10" />
          ) : (
            <p className="text-lg font-semibold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}




