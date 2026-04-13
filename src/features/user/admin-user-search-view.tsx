/**
 * ─── ADMIN USER SEARCH VIEW ──────────────────────────────────────────────────
 *
 * Renders the user search DataExplorer with column definitions and
 * user-specific formatting. This is the feature-level component that
 * wires the generic DataExplorer to the user search API.
 *
 * Role options in the filter panel are fetched dynamically from
 * GET /api/v1/admin/roles — no hardcoded role list.
 */

"use client"

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { searchUsers } from "@/features/user/api/user-search.api"
import { USER_FILTER_CONFIG } from "@/features/user/api/user-search.config"
import { listRoles } from "@/features/user/api/admin-roles.api"
import type { AdminUserResponse } from "@/features/user/api/user-search.types"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CheckCircle2,
  XCircle,
  Lock,
  Shield,
  Trash2,
} from "lucide-react"
import { useRouter } from "nextjs-toploader/app";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string | null, email: string): string {
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

/**
 * Converts a role name to a human-readable display format.
 * Handles both "ROLE_ADMIN" and "ADMIN" style names.
 */
function roleDisplayName(role: string): string {
  return role
    .replace("ROLE_", "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
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
    <Badge variant="outline" className="gap-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-3" />
      Active
    </Badge>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const USER_COLUMNS: DataColumn<AdminUserResponse>[] = [
  {
    key: "name",
    header: "User",
    sortable: true,
    render: (user) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
          <AvatarFallback className="text-xs">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {user.name ?? "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "username",
    header: "Username",
    sortable: true,
    hideOnMobile: true,
    render: (user) => (
      <span className="text-sm text-muted-foreground">
        {user.username ? `@${user.username}` : "—"}
      </span>
    ),
  },
  {
    key: "roles",
    header: "Roles",
    hideOnMobile: true,
    render: (user) => (
      <div className="flex flex-wrap gap-1">
        {user.roles.map((role) => (
          <Badge key={role} variant="secondary" className="gap-1 text-xs">
            <Shield className="size-3" />
            {roleDisplayName(role)}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (user) => (
      <StatusBadge
        active={user.isEnabled}
        locked={!user.isAccountNonLocked}
        deleted={user.isDeleted}
      />
    ),
  },
  {
    key: "isEmailVerified",
    header: "Email",
    hideOnMobile: true,
    render: (user) => (
      <div className="flex items-center gap-1.5">
        {user.isEmailVerified ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <XCircle className="size-4 text-amber-500" />
        )}
        <span className="text-xs text-muted-foreground">
          {user.isEmailVerified ? "Verified" : "Pending"}
        </span>
      </div>
    ),
  },
  {
    key: "lastLoginAt",
    header: "Last Login",
    hideOnMobile: true,
    render: (user) => (
      <span className="text-xs text-muted-foreground">
        {formatDateTime(user.lastLoginAt)}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    hideOnMobile: true,
    render: (user) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(user.createdAt)}
      </span>
    ),
  },
]

// ─── View Component ───────────────────────────────────────────────────────────

export default function AdminUserSearchView() {
  const router = useRouter()

  // ── Fetch all roles dynamically from the backend ──────────────────────────
  const { data: rolesData } = useQuery({
    queryKey: ["admin-roles-list"],
    queryFn: () => listRoles(0, 100),
    staleTime: 5 * 60 * 1000, // roles rarely change — cache for 5 min
  })

  // ── Build dynamic config with role options from the API ───────────────────
  const dynamicConfig = useMemo<FilterConfig>(() => {
    const roleOptions = (rolesData?.content ?? []).map((role) => ({
      // Display: title-case without ROLE_ prefix  →  "Admin", "Mentor"
      label: roleDisplayName(role.name),
      // Value: raw name from backend (no ROLE_ prefix) → "ADMIN", "MENTOR"
      value: role.name,
    }))

    return {
      ...USER_FILTER_CONFIG,
      joinFields: (USER_FILTER_CONFIG.joinFields ?? []).map((jf) =>
        jf.association === "roles" && jf.field === "role"
          ? { ...jf, options: roleOptions }
          : jf,
      ),
    }
  }, [rolesData])

  const search = useGenericSearch<AdminUserResponse>({
    queryKey: "admin-user-search",
    searchFn: searchUsers,
    config: dynamicConfig,
  })

  return (
    <DataExplorer<AdminUserResponse>
      search={search}
      columns={USER_COLUMNS}
      getRowKey={(user) => user.userId}
      title="User Management"
      description="Search, filter, and manage all platform users."
      onRowClick={(user) => router.push(`/users/${user.userId}`)}
    />
  )
}
