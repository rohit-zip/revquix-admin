/**
 * ─── ADMIN USER DETAIL VIEW ─────────────────────────────────────────────────
 *
 * Main feature component for the /admin/users/[userId] page.
 * Shows a user header with basic info, and a tabbed layout for
 * managing different aspects of the user.
 *
 * Tabs are conditionally rendered based on the admin's permissions:
 *   • "Roles"                → PERM_MANAGE_ROLES
 *   • "Permission Overrides" → PERM_MANAGE_USER_ROLES
 *   • (Future) "Bookings"    → PERM_VIEW_ALL_BOOKINGS
 *   • (Future) "Login History"→ to be defined
 *   • (Future) "Sessions"    → to be defined
 *
 * ── APIs NOT directly used on this page ──────────────────────────────────────
 *  None — all listed APIs are consumed by tab sub-components.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Shield,
  Key,
  Mail,
  CheckCircle2,
  XCircle,
  Lock,
  Trash2,
  User,
  Calendar,
  Clock,
  History,
  Monitor,
  UserCircle,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthorization } from "@/hooks/useAuthorization"

import { useAdminUser } from "@/features/admin/api/admin-user.hooks"
import UserRolesTab from "@/features/admin/components/user-roles-tab"
import UserPermissionOverridesTab from "@/features/admin/components/user-permission-overrides-tab"
import UserProfileTab from "@/features/admin/components/user-profile-tab"
import UserSessionsTab from "@/features/admin/components/user-sessions-tab"
import UserLoginHistoryTab from "@/features/admin/components/user-login-history-tab"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

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

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

function roleDisplayName(role: string): string {
  return role
    .replace("ROLE_", "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminUserDetailViewProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUserDetailView({ userId }: AdminUserDetailViewProps) {
  const router = useRouter()
  const { hasAnyAuthority } = useAuthorization()

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: user, isLoading, isError } = useAdminUser(userId)

  // ── Tab visibility based on permissions ───────────────────────────────────
  const canManageRoles = hasAnyAuthority(["PERM_MANAGE_ROLES"])
  const canManageUserPermissions = hasAnyAuthority(["PERM_MANAGE_USER_ROLES"])
  const canManageUsers = hasAnyAuthority(["PERM_MANAGE_USERS", "PERM_MANAGE_ROLES", "PERM_MANAGE_USER_ROLES"])
  // Future tabs
  // const canViewBookings = hasAnyAuthority(["PERM_VIEW_ALL_BOOKINGS"])

  // ── Compute the default tab ───────────────────────────────────────────────
  const defaultTab = "profile"

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError || !user) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="size-4" />
          Back to Users
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="size-12 text-destructive mb-3" />
            <p className="text-lg font-medium">User not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              The user may have been deleted or the ID is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Back navigation ────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => router.push("/admin/users")}
      >
        <ArrowLeft className="size-4" />
        Back to Users
      </Button>

      {/* ── User Header Card ───────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <Avatar className="size-16">
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.name ?? user.email}
              />
              <AvatarFallback className="text-lg">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold truncate">
                  {user.name ?? "Unnamed User"}
                </h1>
                <StatusBadge
                  active={user.isEnabled ?? true}
                  locked={!(user.isAccountNonLocked ?? true)}
                  deleted={user.isDeleted ?? false}
                />
              </div>

              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                <span className="truncate">{user.email}</span>
                {user.isEmailVerified ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="size-3.5 text-amber-500" />
                )}
              </div>

              {user.username && (
                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                  <User className="size-3.5" />
                  <span>@{user.username}</span>
                </div>
              )}

              {/* Role badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="gap-1 text-xs">
                    <Shield className="size-3" />
                    {roleDisplayName(role)}
                  </Badge>
                ))}
              </div>

              {/* Meta info */}
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="size-3" />
                  <span>ID: {user.userId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3" />
                    <span>Last login {formatDateTime(user.lastLoginAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabbed Content ─────────────────────────────────────────────────── */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {canManageUsers && (
            <TabsTrigger value="profile" className="gap-1.5">
              <UserCircle className="size-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="roles" className="gap-1.5">
              <Shield className="size-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
          )}
          {canManageUserPermissions && (
            <TabsTrigger value="overrides" className="gap-1.5">
              <Key className="size-4" />
              <span className="hidden sm:inline">Permission Overrides</span>
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="sessions" className="gap-1.5">
              <Monitor className="size-4" />
              <span className="hidden sm:inline">Active Sessions</span>
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="login-history" className="gap-1.5">
              <History className="size-4" />
              <span className="hidden sm:inline">Login History</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Profile Tab ────────────────────────────────────────────────── */}
        {canManageUsers && (
          <TabsContent value="profile" className="mt-6">
            <UserProfileTab userId={userId} />
          </TabsContent>
        )}

        {/* ── Roles Tab ──────────────────────────────────────────────────── */}
        {canManageRoles && (
          <TabsContent value="roles" className="mt-6">
            <UserRolesTab
              userId={userId}
              userRoles={user.roles}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        {/* ── Permission Overrides Tab ───────────────────────────────────── */}
        {canManageUserPermissions && (
          <TabsContent value="overrides" className="mt-6">
            <UserPermissionOverridesTab userId={userId} />
          </TabsContent>
        )}

        {/* ── Active Sessions Tab ────────────────────────────────────────── */}
        {canManageUsers && (
          <TabsContent value="sessions" className="mt-6">
            <UserSessionsTab userId={userId} />
          </TabsContent>
        )}

        {/* ── Login History Tab ──────────────────────────────────────────── */}
        {canManageUsers && (
          <TabsContent value="login-history" className="mt-6">
            <UserLoginHistoryTab userId={userId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  active,
  locked,
  deleted,
}: {
  active: boolean
  locked: boolean
  deleted: boolean
}) {
  if (deleted) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <Trash2 className="size-3" />
        Deleted
      </Badge>
    )
  }
  if (locked) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <Lock className="size-3" />
        Locked
      </Badge>
    )
  }
  if (!active) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <XCircle className="size-3" />
        Disabled
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
    >
      <CheckCircle2 className="size-3" />
      Active
    </Badge>
  )
}

