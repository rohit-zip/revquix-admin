/**
 * ─── ADMIN COMPANIES VIEW ────────────────────────────────────────────────────
 *
 * Main view component for /companies admin page.
 * Uses DataExplorer + useGenericSearch (filter engine) for
 * search, isVerified/isActive filtering, date ranges and sort.
 */

"use client"

import React, { useState } from "react"
import { Building2, Pencil, PowerOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { searchAdminCompanies } from "@/features/admin/companies/company.api"
import type { AdminCompanyResponse } from "@/features/admin/companies/company.types"
import { useUpdateAdminCompany } from "@/features/admin/companies/company.hooks"
import { CompanyEditModal } from "@/features/admin/companies/components/company-edit-modal"

// ─── Filter config ────────────────────────────────────────────────────────────

const COMPANY_FILTER_CONFIG: FilterConfig = {
  searchableFields: ["name", "domain"],
  filterFields: [
    {
      field: "isVerified",
      label: "Verified",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Verified", value: "true" },
        { label: "Unverified", value: "false" },
      ],
    },
    {
      field: "isActive",
      label: "Active",
      type: "BOOLEAN",
      operators: ["EQUALS"],
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Created Date", type: "INSTANT" },
    { field: "updatedAt", label: "Updated Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "name", label: "Name" },
    { field: "createdAt", label: "Created Date" },
    { field: "updatedAt", label: "Updated Date" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<AdminCompanyResponse>[] = [
  { key: "logo", header: "Logo", sortable: false },
  { key: "name", header: "Name", sortable: true },
  { key: "domain", header: "Domain", sortable: false, hideOnMobile: true },
  { key: "isVerified", header: "Verified", sortable: false },
  { key: "isActive", header: "Active", sortable: false, hideOnMobile: true },
  { key: "userCount", header: "Users", sortable: false, hideOnMobile: true },
  { key: "createdAt", header: "Created", sortable: true, hideOnMobile: true },
  { key: "actions", header: "Actions", sortable: false },
]

// ─── Company Logo ─────────────────────────────────────────────────────────────

function CompanyLogo({ company }: { company: AdminCompanyResponse }) {
  const src = company.logoUrl ?? (company.domain ? `https://logo.clearbit.com/${company.domain}` : null)
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
        {company.name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={company.name}
      className="h-8 w-8 rounded object-contain"
      onError={() => setImgError(true)}
    />
  )
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function AdminCompaniesView() {
  const [editingCompany, setEditingCompany] = useState<AdminCompanyResponse | null>(null)

  const search = useGenericSearch<AdminCompanyResponse>({
    queryKey: "admin-company-search",
    searchFn: searchAdminCompanies,
    config: COMPANY_FILTER_CONFIG,
  })

  const updateMutation = useUpdateAdminCompany(() => search.refetch())

  const handleToggleActive = (company: AdminCompanyResponse) => {
    updateMutation.mutate({
      companyId: company.companyId,
      data: { isActive: !company.isActive },
    })
  }

  return (
    <>
      <DataExplorer
        search={search}
        columns={columns}
        title="Company Registry"
        description="Manage and verify companies referenced in user work experience."
        emptyState={
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No companies found</p>
          </div>
        }
        renderRow={(company) => (
          <TableRow key={company.companyId}>
            <TableCell>
              <CompanyLogo company={company} />
            </TableCell>
            <TableCell className="font-medium">{company.name}</TableCell>
            <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
              {company.domain ?? <span className="italic text-muted-foreground/60">—</span>}
            </TableCell>
            <TableCell>
              {company.isVerified ? (
                <Badge variant="default" className="text-[11px]">Verified</Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] border-amber-300 text-amber-600">Unverified</Badge>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {company.isActive ? (
                <Badge variant="secondary" className="text-[11px]">Active</Badge>
              ) : (
                <Badge variant="destructive" className="text-[11px]">Inactive</Badge>
              )}
            </TableCell>
            <TableCell className="hidden tabular-nums md:table-cell">
              {company.userCount.toLocaleString()}
            </TableCell>
            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
              {formatDate(company.createdAt)}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingCompany(company)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(company)}
                  disabled={updateMutation.isPending}
                  className={
                    company.isActive
                      ? "h-7 w-7 p-0 text-destructive hover:text-destructive"
                      : "h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  }
                  title={company.isActive ? "Deactivate" : "Reactivate"}
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  <span className="sr-only">{company.isActive ? "Deactivate" : "Reactivate"}</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <CompanyEditModal
        company={editingCompany}
        open={!!editingCompany}
        onClose={() => setEditingCompany(null)}
        onUpdated={() => search.refetch()}
      />
    </>
  )
}
