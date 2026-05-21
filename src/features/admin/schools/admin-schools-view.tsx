/**
 * ─── ADMIN SCHOOLS VIEW ──────────────────────────────────────────────────────
 *
 * Main view component for /schools admin page.
 * Uses DataExplorer + useGenericSearch (filter engine) for
 * search, isVerified/isActive/country filtering, date ranges and sort.
 */

"use client"

import React, { useState } from "react"
import { GraduationCap, Pencil, PowerOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchAdminSchools } from "@/features/admin/schools/school.api"
import type { AdminSchoolResponse } from "@/features/admin/schools/school.types"
import { useUpdateAdminSchool } from "@/features/admin/schools/school.hooks"
import { SchoolEditModal } from "@/features/admin/schools/components/school-edit-modal"
import { SchoolLogo } from "@/features/admin/schools/components/school-logo"

// ─── Filter config ────────────────────────────────────────────────────────────

const SCHOOL_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["name", "shortName", "domain", "city"],
  filterFields: [
    {
      field: "isVerified",
      label: "Verified",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Verified",   value: "true"  },
        { label: "Unverified", value: "false" },
      ],
    },
    {
      field: "isActive",
      label: "Active",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Active",   value: "true"  },
        { label: "Inactive", value: "false" },
      ],
    },
    {
      field: "country",
      label: "Country",
      type: "STRING",
      operators: ["EQUALS", "LIKE"],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Created Date", type: "INSTANT" },
    { field: "updatedAt", label: "Updated Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "name",      label: "Name"         },
    { field: "userCount", label: "User Count"   },
    { field: "createdAt", label: "Created Date" },
    { field: "updatedAt", label: "Updated Date" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<AdminSchoolResponse>[] = [
  { key: "logo",       header: "Logo",     sortable: false                             },
  { key: "name",       header: "Name",     sortable: true                              },
  { key: "location",   header: "Location", sortable: false, hideOnMobile: true         },
  { key: "isVerified", header: "Verified", sortable: false                             },
  { key: "isActive",   header: "Active",   sortable: false, hideOnMobile: true         },
  { key: "userCount",  header: "Users",    sortable: true,  hideOnMobile: true         },
  { key: "createdAt",  header: "Created",  sortable: true,  hideOnMobile: true         },
  { key: "actions",    header: "Actions",  sortable: false                             },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  })
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function AdminSchoolsView() {
  const [editingSchool, setEditingSchool] = useState<AdminSchoolResponse | null>(null)

  const search = useGenericSearch<AdminSchoolResponse>({
    queryKey: "admin-school-search",
    searchFn:  searchAdminSchools,
    config:    SCHOOL_FILTER_CONFIG,
  })

  const updateMutation = useUpdateAdminSchool(() => search.refetch())

  const handleToggleActive = (school: AdminSchoolResponse) => {
    updateMutation.mutate({
      schoolId: school.schoolId,
      data: { isActive: !school.isActive },
    })
  }

  return (
    <>
      <DataExplorer
        search={search}
        columns={columns}
        title="School Registry"
        description="Manage and verify schools & universities referenced in user education history."
        emptyState={
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No schools found</p>
          </div>
        }
        renderRow={(school) => (
          <TableRow key={school.schoolId}>

            {/* Logo */}
            <TableCell>
              <SchoolLogo school={school} size="sm" />
            </TableCell>

            {/* Name + short name */}
            <TableCell>
              <span className="font-medium">{school.name}</span>
              {school.shortName && (
                <span className="ml-1.5 text-xs text-muted-foreground">({school.shortName})</span>
              )}
            </TableCell>

            {/* Location */}
            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
              {school.city && school.country
                ? `${school.city}, ${school.country}`
                : (school.city ?? school.country ?? <span className="italic text-muted-foreground/60">—</span>)
              }
            </TableCell>

            {/* Verified badge */}
            <TableCell>
              {school.isVerified ? (
                <Badge variant="default"  className="text-[11px]">Verified</Badge>
              ) : (
                <Badge variant="outline"  className="text-[11px] border-amber-300 text-amber-600">Unverified</Badge>
              )}
            </TableCell>

            {/* Active badge */}
            <TableCell className="hidden md:table-cell">
              {school.isActive ? (
                <Badge variant="secondary"    className="text-[11px]">Active</Badge>
              ) : (
                <Badge variant="destructive"  className="text-[11px]">Inactive</Badge>
              )}
            </TableCell>

            {/* User count */}
            <TableCell className="hidden tabular-nums md:table-cell">
              {school.userCount.toLocaleString()}
            </TableCell>

            {/* Created date */}
            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
              {formatDate(school.createdAt)}
            </TableCell>

            {/* Actions */}
            <TableCell>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingSchool(school)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(school)}
                  disabled={updateMutation.isPending}
                  className={
                    school.isActive
                      ? "h-7 w-7 p-0 text-destructive hover:text-destructive"
                      : "h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  }
                  title={school.isActive ? "Deactivate" : "Reactivate"}
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  <span className="sr-only">{school.isActive ? "Deactivate" : "Reactivate"}</span>
                </Button>
              </div>
            </TableCell>

          </TableRow>
        )}
      />

      <SchoolEditModal
        school={editingSchool}
        open={!!editingSchool}
        onClose={() => setEditingSchool(null)}
        onUpdated={() => search.refetch()}
      />
    </>
  )
}
