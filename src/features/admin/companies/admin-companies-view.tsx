/**
 * ─── ADMIN COMPANIES VIEW ────────────────────────────────────────────────────
 *
 * Main view component for /companies admin page.
 * Shows a paginated, searchable table of all companies in the registry.
 * Supports inline editing via a modal dialog.
 */

"use client"

import React, { useState } from "react"
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminCompanies } from "@/features/admin/companies/company.hooks"
import type { AdminCompanyResponse } from "@/features/admin/companies/company.types"
import { CompanyEditModal } from "@/features/admin/companies/components/company-edit-modal"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

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

// ─── Main View ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function AdminCompaniesView() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [filterUnverified, setFilterUnverified] = useState(false)
  const [editingCompany, setEditingCompany] = useState<AdminCompanyResponse | null>(null)

  const { data, isLoading, isError } = useAdminCompanies({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    isVerified: filterUnverified ? false : undefined,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearch("")
    setPage(0)
  }

  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Company Registry</h1>
            <p className="text-sm text-muted-foreground">
              Manage and verify companies referenced in user work experience.
            </p>
          </div>
          {data && (
            <Badge variant="secondary" className="w-fit">
              {totalElements.toLocaleString()} companies
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Companies</CardTitle>
            <CardDescription>
              Unverified companies are created automatically when users add work experience.
              Verify them by adding a domain (for Clearbit logos) and marking as verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by company name…"
                    className="pl-9 pr-9"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Search
                </Button>
              </form>
              <Button
                variant={filterUnverified ? "default" : "outline"}
                size="sm"
                onClick={() => { setFilterUnverified((v) => !v); setPage(0) }}
                className="shrink-0"
              >
                {filterUnverified ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : null}
                Unverified only
              </Button>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm font-medium text-destructive">Failed to load companies</p>
                <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
              </div>
            ) : !data || data.content.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No companies found</p>
                {search && (
                  <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Logo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead className="text-center">Verified</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.content.map((company) => (
                      <TableRow key={company.companyId}>
                        <TableCell>
                          <CompanyLogo company={company} />
                        </TableCell>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {company.domain ?? <span className="italic text-muted-foreground/60">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {company.isVerified ? (
                            <Badge variant="default" className="text-[11px]">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {company.isActive ? (
                            <Badge variant="secondary" className="text-[11px]">Active</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[11px]">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {company.userCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(company.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCompany(company)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {data && totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Page {page + 1} of {totalPages} · {totalElements.toLocaleString()} total
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <CompanyEditModal
        company={editingCompany}
        open={!!editingCompany}
        onClose={() => setEditingCompany(null)}
      />
    </>
  )
}
