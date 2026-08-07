"use client"

/**
 * ─── PLATFORM HEALTH ──────────────────────────────────────────────────────────
 *
 * The eight engineering diagnostics, on one row of the sidebar instead of eight.
 *
 * <h3>Nothing here is deleted or rewritten — only relocated</h3>
 * An engineer diagnosing "why is this mentor's service not in the marketplace" still needs every one
 * of these consoles, and they are good at what they do. What they are not is daily operator work, so
 * they should not cost an operator eight rows of vertical scanning every time they open the sidebar
 * looking for Disputes.
 *
 * <h3>Tab state lives in the URL</h3>
 * `?tab=search` — so the old `/mentorship-v2/search` bookmark can redirect here and land where the
 * engineer expected, and so a link to a specific diagnostic is still a link.
 *
 * <h3>Each tab mounts lazily</h3>
 * These views are heavy: several fire three or four snapshot queries on mount, and one of them runs
 * a pgvector capability probe. Mounting all eight to render one would be a self-inflicted load test.
 */

import { Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  ArrowRightLeft,
  Brain,
  CalendarSearch,
  Coins,
  FlaskConical,
  Package,
  Receipt,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Video,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import JobsView from "./jobs-view"
import AuditView from "./audit-view"
import AdminCallVerificationView from "@/features/mentorship-v2/admin-call-verification-view"
import AdminCommerceVerificationView from "@/features/mentorship-v2/admin-commerce-verification-view"
import AdminDisputeVerificationView from "@/features/mentorship-v2/admin-dispute-verification-view"
import AdminAvailabilityVerificationView from "@/features/mentorship-v2/admin-availability-verification-view"
import AdminPricingVerificationView from "@/features/mentorship-v2/admin-pricing-verification-view"
import AdminSearchVerificationView from "@/features/mentorship-v2/admin-search-verification-view"
import AdminSemanticVerificationView from "@/features/mentorship-v2/admin-semantic-verification-view"
import AdminPackageVerificationView from "@/features/mentorship-v2/admin-package-verification-view"
import AdminServiceCatalogVerificationView from "@/features/mentorship-v2/admin-service-catalog-verification-view"
import AdminCutoverVerificationView from "@/features/mentorship-v2/admin-cutover-verification-view"
import AdminMentorshipV2VerificationView from "@/features/mentorship-v2/admin-mentorship-v2-verification-view"

const TABS = PATH_CONSTANTS.ADMIN_PM_PLATFORM_TABS

const TAB_ORDER = [
  // Jobs first: it is the only tab that answers "is the platform working right now", and it is the
  // one an on-call engineer opens before any of the others.
  { value: TABS.JOBS, label: "Jobs", Icon: Activity },
  // The three "engine" tabs are the diagnostic half of the operator pages that replaced their
  // consoles: Sessions, Orders and Disputes each got the records, and each left behind a set of
  // invariants, sweeps and feeds an operator never needs and an on-call engineer always does.
  { value: TABS.SESSIONS_ENGINE, label: "Sessions engine", Icon: Video },
  { value: TABS.COMMERCE_ENGINE, label: "Commerce engine", Icon: Receipt },
  { value: TABS.DISPUTES_ENGINE, label: "Disputes engine", Icon: ShieldAlert },
  { value: TABS.AVAILABILITY, label: "Availability", Icon: CalendarSearch },
  { value: TABS.PRICING, label: "Pricing & FX", Icon: Coins },
  { value: TABS.SEARCH, label: "Search", Icon: Search },
  { value: TABS.SEMANTIC, label: "Semantic", Icon: Brain },
  { value: TABS.PACKAGES, label: "Packages engine", Icon: Package },
  { value: TABS.CATALOGUE_TOOLS, label: "Catalogue tools", Icon: ShoppingBag },
  { value: TABS.MIGRATION, label: "Migration", Icon: ArrowRightLeft },
  { value: TABS.FOUNDATIONS, label: "Foundations", Icon: FlaskConical },
  { value: TABS.AUDIT, label: "Audit", Icon: ShieldCheck },
]

type TabValue = (typeof TAB_ORDER)[number]["value"]

const VALID = new Set<string>(TAB_ORDER.map((tab) => tab.value))

/** Narrows an arbitrary `?tab=` to a tab we render, so a hand-typed URL cannot blank the page. */
function resolveTab(requested: string | null): TabValue {
  return VALID.has(requested ?? "") ? (requested as TabValue) : TABS.JOBS
}

export default function PlatformHealthView() {
  const router = useRouter()
  const params = useSearchParams()
  const active = resolveTab(params.get("tab"))

  const setTab = useCallback(
    (value: string) => {
      // replace, not push: flipping between diagnostics should not build a back-button history the
      // engineer then has to click through to leave the page.
      router.replace(`${PATH_CONSTANTS.ADMIN_PM_PLATFORM}?tab=${value}`, { scroll: false })
    },
    [router],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ServerCog className="size-6" /> Platform Health
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          The engineering diagnostics for the Professional Mentor subsystem — the availability engine,
          pricing and FX, marketplace search, the packages engine, the legacy migration, and the
          foundations check you open when something looks wrong everywhere rather than in one place.
        </p>
      </header>

      <Tabs value={active} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {TAB_ORDER.map(({ value, label, Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 whitespace-nowrap">
                <Icon className="size-3.5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={TABS.JOBS} className="mt-4">
          {active === TABS.JOBS ? <JobsView /> : null}
        </TabsContent>
        <TabsContent value={TABS.SESSIONS_ENGINE} className="mt-4">
          {active === TABS.SESSIONS_ENGINE ? <AdminCallVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.COMMERCE_ENGINE} className="mt-4">
          {active === TABS.COMMERCE_ENGINE ? <AdminCommerceVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.DISPUTES_ENGINE} className="mt-4">
          {active === TABS.DISPUTES_ENGINE ? <AdminDisputeVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.AVAILABILITY} className="mt-4">
          {active === TABS.AVAILABILITY ? <AdminAvailabilityVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.PRICING} className="mt-4">
          {active === TABS.PRICING ? <AdminPricingVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.SEARCH} className="mt-4">
          {active === TABS.SEARCH ? <AdminSearchVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.SEMANTIC} className="mt-4">
          {active === TABS.SEMANTIC ? <AdminSemanticVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.PACKAGES} className="mt-4">
          {active === TABS.PACKAGES ? <AdminPackageVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.CATALOGUE_TOOLS} className="mt-4">
          {active === TABS.CATALOGUE_TOOLS ? <AdminServiceCatalogVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.MIGRATION} className="mt-4">
          {active === TABS.MIGRATION ? <AdminCutoverVerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.FOUNDATIONS} className="mt-4">
          {active === TABS.FOUNDATIONS ? <AdminMentorshipV2VerificationView /> : null}
        </TabsContent>
        <TabsContent value={TABS.AUDIT} className="mt-4">
          {active === TABS.AUDIT ? <AuditView /> : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** The page wraps this in Suspense — `useSearchParams` has nothing to return while prerendering. */
export function PlatformHealthViewWithSuspense() {
  return (
    <Suspense fallback={null}>
      <PlatformHealthView />
    </Suspense>
  )
}
