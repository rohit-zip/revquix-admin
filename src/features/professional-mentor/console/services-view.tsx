"use client"

/**
 * ─── SERVICE CATALOGUE ────────────────────────────────────────────────────────
 *
 * What every mentor is selling.
 *
 * <h3>The `indexed` column is the reason this page is worth building</h3>
 * A service that is ACTIVE and PUBLIC but has no marketplace projection row is invisible to buyers
 * while looking perfectly healthy to its mentor — and "why is my service not showing up" is the
 * single most common support question this subsystem generates. That state was previously only
 * visible by running a drift check on a diagnostics console, i.e. by already suspecting it. Here it
 * is a column, and a filter, on the page you would open anyway.
 */

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, ShoppingBag, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { searchServices } from "@/features/mentorship-v2/api/admin-lists.api"
import { SERVICES_FILTER_CONFIG } from "@/features/mentorship-v2/api/admin-lists.config"
import type { AdminCatalogueRow } from "@/features/mentorship-v2/api/admin-lists.types"
import { PersonCell, RefLink, StatusBadge, formatMinor, formatWhen, humanise } from "./console-format"

export default function ProfessionalMentorServicesView() {
  const router = useRouter()
  const search = useGenericSearch<AdminCatalogueRow>({
    queryKey: "pm-services",
    searchFn: searchServices,
    config: SERVICES_FILTER_CONFIG,
  })

  const columns = useMemo<DataColumn<AdminCatalogueRow>[]>(
    () => [
      {
        key: "title",
        header: "Service",
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.title ?? "Untitled"}</p>
            <RefLink id={row.serviceId} href={`${PATH_CONSTANTS.ADMIN_PM_SERVICES}/${row.serviceId}`} />
          </div>
        ),
      },
      {
        key: "mentor",
        header: "Mentor",
        render: (row) => <PersonCell name={row.mentorName} userId={row.mentorUserId} />,
      },
      {
        key: "serviceType",
        header: "Type",
        sortable: true,
        hideOnMobile: true,
        render: (row) => (
          <Badge variant="outline" className="font-normal">
            {humanise(row.serviceType)}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => (
          <div className="space-y-1">
            <StatusBadge status={row.status} />
            {row.visibility && row.visibility !== "PUBLIC" ? (
              <div>
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  {row.visibility.toLowerCase()}
                </Badge>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        // See the file header: ACTIVE + PUBLIC + not indexed is the support question, made visible.
        key: "indexed",
        header: "Marketplace",
        render: (row) => {
          const shouldBeIndexed = row.status === "ACTIVE" && row.visibility === "PUBLIC"
          if (row.indexed) {
            return (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-emerald-600">
                <CheckCircle2 className="size-3" aria-hidden="true" /> indexed
              </span>
            )
          }
          if (shouldBeIndexed) {
            return (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-destructive">
                <AlertTriangle className="size-3" aria-hidden="true" /> not indexed
              </span>
            )
          }
          return <span className="whitespace-nowrap text-xs text-muted-foreground">not listed</span>
        },
      },
      {
        key: "basePriceMinor",
        header: "Price",
        sortable: true,
        render: (row) => (
          <div className="min-w-0 whitespace-nowrap">
            <p className="text-sm">{formatMinor(row.basePriceMinor, row.baseCurrency)}</p>
            {row.usdPriceMinor ? (
              <p className="text-[10px] text-muted-foreground">
                {formatMinor(row.usdPriceMinor, "USD")}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "orderCount",
        header: "Orders",
        sortable: true,
        hideOnMobile: true,
        render: (row) => (
          <div className="min-w-0 whitespace-nowrap">
            <p className="text-sm">{row.orderCount ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">{row.completedCount ?? 0} completed</p>
          </div>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        hideOnMobile: true,
        render: (row) =>
          row.avgRating ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {Number(row.avgRating).toFixed(1)}
              <span className="text-[10px] text-muted-foreground">({row.reviewCount ?? 0})</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">unrated</span>
          ),
      },
      {
        key: "publishedAt",
        header: "Published",
        sortable: true,
        hideOnMobile: true,
        render: (row) => (
          <span className="whitespace-nowrap text-xs">{formatWhen(row.publishedAt)}</span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShoppingBag className="size-6" /> Service Catalogue
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every service mentors are selling, and whether each one can actually be found. A service
          marked <strong>not indexed</strong> while active and public is invisible in the marketplace —
          open it to see which publish gate or content check is holding it back.
        </p>
      </header>

      <DataExplorer
        search={search}
        columns={columns}
        getRowKey={(row) => row.serviceId}
        title="All services"
        description="Newest first. Filter by status, visibility, mentor or type."
        onRowClick={(row) => router.push(`${PATH_CONSTANTS.ADMIN_PM_SERVICES}/${row.serviceId}`)}
      />
    </div>
  )
}
