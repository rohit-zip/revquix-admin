"use client"

/**
 * ─── ORDERS ───────────────────────────────────────────────────────────────────
 *
 * Three tabs, because all three are artefacts of the same purchase and an operator moving between
 * them is following one customer's money. Splitting them into three sidebar rows — which is what
 * Packages was before — makes that trail a navigation exercise.
 *
 *   Orders       · what was charged, what the mentor nets, why a checkout failed
 *   Refunds      · the list that did not exist: `GET /refunds` needs an orderId, so
 *                  "what did we refund last month" had no answer at all
 *   Entitlements · what a package buyer still owns, and the escrow still held against it
 *
 * <h3>The two-currency rule, enforced by layout</h3>
 * A country-priced order charges the buyer in one currency and pays the mentor in another. The
 * table gives each side its own column group with its own currency symbol and never renders a
 * combined total, because a combined total of two currencies is not a number. This was corrected
 * once already on the post-order surfaces; the shape here is what keeps it corrected.
 */

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Receipt, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useGenericSearch } from "@/core/filters"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import {
  searchEntitlements,
  searchOrders,
  searchRefunds,
} from "@/features/mentorship-v2/api/admin-lists.api"
import {
  ENTITLEMENTS_FILTER_CONFIG,
  ORDERS_FILTER_CONFIG,
  REFUNDS_FILTER_CONFIG,
} from "@/features/mentorship-v2/api/admin-lists.config"
import type {
  AdminEntitlementRow,
  AdminOrderRow,
  AdminRefundRow,
} from "@/features/mentorship-v2/api/admin-lists.types"
import {
  PersonCell,
  RefLink,
  StatusBadge,
  formatMinor,
  formatWhen,
  humanise,
} from "./console-format"

export default function ProfessionalMentorOrdersView() {
  const [tab, setTab] = useState("orders")

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Receipt className="size-6" /> Orders
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every Professional Mentor purchase end to end — what the buyer was charged, what the mentor
          nets, what came back as a refund, and what a package buyer still owns.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders" className="gap-1.5">
            <Receipt className="size-3.5" /> Orders
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-1.5">
            <RotateCcw className="size-3.5" /> Refunds
          </TabsTrigger>
          <TabsTrigger value="entitlements" className="gap-1.5">
            <Package className="size-3.5" /> Packages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <OrdersTable />
        </TabsContent>
        <TabsContent value="refunds" className="mt-4">
          <RefundsTable />
        </TabsContent>
        <TabsContent value="entitlements" className="mt-4">
          <EntitlementsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Tab 1 ────────────────────────────────────────────────────────────────────

function OrdersTable() {
  const router = useRouter()
  const search = useGenericSearch<AdminOrderRow>({
    queryKey: "pm-orders",
    searchFn: searchOrders,
    config: ORDERS_FILTER_CONFIG,
  })

  const columns = useMemo<DataColumn<AdminOrderRow>[]>(
    () => [
      {
        key: "orderNumber",
        header: "Order",
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <RefLink
              id={row.orderNumber ?? row.orderId}
              href={`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${row.orderId}`}
            />
            <p className="mt-0.5 truncate text-xs">{row.serviceTitle ?? row.serviceType ?? "—"}</p>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (row) => <span className="whitespace-nowrap text-xs">{formatWhen(row.createdAt)}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => (
          <div className="space-y-1">
            <StatusBadge status={row.status} label={row.statusLabel} />
            {/*
              Only when the status does not already say it. A REFUNDED order rendering a "Refunded"
              badge above a "refunded" chip says one thing twice; the chip earns its place solely on
              a PAID order that has a refund against it, which the status alone would hide.
            */}
            {row.refunded && !row.status.includes("REFUND") ? (
              <div>
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  has refund
                </Badge>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: "buyer",
        header: "Buyer",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.buyerName} userId={row.buyerUserId} />,
      },
      {
        key: "mentor",
        header: "Mentor",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.mentorName} userId={row.mentorUserId} />,
      },
      {
        // Buyer side. Its own column, with its own currency — never combined with the mentor's.
        key: "grossAmountMinor",
        header: "Buyer paid",
        sortable: true,
        render: (row) => (
          <div className="min-w-0 whitespace-nowrap">
            <p className="text-sm font-medium">
              {formatMinor(row.grossAmountMinor, row.chargeCurrency)}
            </p>
            {row.refundedAmountMinor && row.refundedAmountMinor > 0 ? (
              <p className="text-[10px] text-muted-foreground">
                −{formatMinor(row.refundedAmountMinor, row.chargeCurrency)} refunded
              </p>
            ) : row.buyerPlatformFeeMinor && row.buyerPlatformFeeMinor > 0 ? (
              <p className="text-[10px] text-muted-foreground">
                incl. {formatMinor(row.buyerPlatformFeeMinor, row.chargeCurrency)} fee
              </p>
            ) : null}
          </div>
        ),
      },
      {
        // Mentor side. Different currency on a country-priced order — that is why it is separate.
        key: "mentorNetMinor",
        header: "Mentor nets",
        sortable: true,
        render: (row) => (
          <div className="min-w-0 whitespace-nowrap">
            <p className="text-sm font-medium">{formatMinor(row.mentorNetMinor, row.baseCurrency)}</p>
            {row.platformFeeMinor && row.platformFeeMinor > 0 ? (
              <p className="text-[10px] text-muted-foreground">
                after {formatMinor(row.platformFeeMinor, row.baseCurrency)} commission
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "bookingId",
        header: "Session",
        hideOnMobile: true,
        render: (row) => (
          <RefLink
            id={row.bookingId}
            href={row.bookingId ? `${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${row.bookingId}` : undefined}
          />
        ),
      },
    ],
    [],
  )

  return (
    <DataExplorer
      search={search}
      columns={columns}
      getRowKey={(row) => row.orderId}
      title="All orders"
      description="Buyer and mentor amounts are shown separately — on a country-priced order they are different currencies."
      onRowClick={(row) => router.push(`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${row.orderId}`)}
    />
  )
}

// ─── Tab 2 ────────────────────────────────────────────────────────────────────

function RefundsTable() {
  const router = useRouter()
  const search = useGenericSearch<AdminRefundRow>({
    queryKey: "pm-refunds",
    searchFn: searchRefunds,
    config: REFUNDS_FILTER_CONFIG,
  })

  const columns = useMemo<DataColumn<AdminRefundRow>[]>(
    () => [
      {
        key: "refundId",
        header: "Refund",
        render: (row) => (
          <div className="min-w-0">
            <span className="font-mono text-xs">{row.refundId}</span>
            <p className="mt-0.5 truncate text-xs">{humanise(row.refundType)}</p>
          </div>
        ),
      },
      {
        key: "initiatedAt",
        header: "Initiated",
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-xs">{formatWhen(row.initiatedAt)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => (
          <div className="space-y-1">
            <StatusBadge status={row.status} />
            {row.settledAt ? (
              <p className="text-[10px] text-muted-foreground">
                settled {formatWhen(row.settledAt)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "amountMinor",
        header: "Amount",
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-sm font-medium">
            {formatMinor(row.amountMinor, row.currency)}
          </span>
        ),
      },
      {
        key: "orderId",
        header: "Order",
        render: (row) => (
          <RefLink
            id={row.orderNumber ?? row.orderId}
            href={`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${row.orderId}`}
          />
        ),
      },
      {
        key: "buyer",
        header: "Buyer",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.buyerName} userId={row.buyerUserId} />,
      },
      {
        key: "mentor",
        header: "Mentor",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.mentorName} userId={row.mentorUserId} />,
      },
      {
        key: "reason",
        header: "Reason",
        hideOnMobile: true,
        render: (row) => (
          <span className="line-clamp-2 max-w-[220px] text-xs text-muted-foreground">
            {row.reason ?? "—"}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DataExplorer
      search={search}
      columns={columns}
      getRowKey={(row) => row.refundId}
      title="All refunds"
      description="Every refund across every order — the reconciliation view the per-order endpoint could not give."
      onRowClick={(row) => router.push(`${PATH_CONSTANTS.ADMIN_PM_ORDERS}/${row.orderId}`)}
    />
  )
}

// ─── Tab 3 ────────────────────────────────────────────────────────────────────

function EntitlementsTable() {
  const search = useGenericSearch<AdminEntitlementRow>({
    queryKey: "pm-entitlements",
    searchFn: searchEntitlements,
    config: ENTITLEMENTS_FILTER_CONFIG,
  })

  const columns = useMemo<DataColumn<AdminEntitlementRow>[]>(
    () => [
      {
        key: "entitlementId",
        header: "Entitlement",
        render: (row) => (
          <div className="min-w-0">
            <span className="font-mono text-xs">{row.entitlementId}</span>
            <p className="mt-0.5 truncate text-xs">{row.childServiceTitle ?? row.childServiceId}</p>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Purchased",
        sortable: true,
        render: (row) => <span className="whitespace-nowrap text-xs">{formatWhen(row.createdAt)}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "buyer",
        header: "Buyer",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.buyerName} userId={row.buyerUserId} />,
      },
      {
        key: "mentor",
        header: "Mentor",
        hideOnMobile: true,
        render: (row) => <PersonCell name={row.mentorName} userId={row.mentorUserId} />,
      },
      {
        key: "remaining",
        header: "Remaining",
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {row.quantityRemaining} / {row.quantityTotal ?? "—"}
          </span>
        ),
      },
      {
        // The escrow the buyer is still owed. Computed server-side from the same arithmetic the
        // settlement sweep uses, so the table cannot disagree with the money.
        key: "escrowMinor",
        header: "Escrow held",
        render: (row) => (
          <span className="whitespace-nowrap text-sm font-medium">
            {formatMinor(row.escrowMinor, row.currency)}
          </span>
        ),
      },
      {
        key: "expiresAt",
        header: "Expires",
        sortable: true,
        render: (row) => (
          <span
            className={
              row.expired
                ? "whitespace-nowrap text-xs font-medium text-destructive"
                : "whitespace-nowrap text-xs"
            }
          >
            {formatWhen(row.expiresAt)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DataExplorer
      search={search}
      columns={columns}
      getRowKey={(row) => row.entitlementId}
      title="Package entitlements"
      description="What each package buyer still owns, and the escrow still held against it."
      emptyState={
        <div className="py-10 text-center text-sm text-muted-foreground">
          No package entitlements yet. Multi-session packages create one row here per child service
          the buyer bought.
        </div>
      }
    />
  )
}
