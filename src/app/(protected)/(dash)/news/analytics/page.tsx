import { notFound } from "next/navigation"
import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { EDITORIAL_ENABLED } from "@/core/constants/feature-flags"
import { NewsAnalyticsView } from "@/features/news/news-analytics-view"

export default function NewsAnalyticsPage() {
  if (!EDITORIAL_ENABLED) notFound()
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL]}>
      <div className="container mx-auto max-w-6xl p-4">
        <NewsAnalyticsView />
      </div>
    </PageGuard>
  )
}
