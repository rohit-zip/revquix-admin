import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { NewsAnalyticsView } from "@/features/news/news-analytics-view"

export default function NewsAnalyticsPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL]}>
      <div className="container mx-auto max-w-6xl p-4">
        <NewsAnalyticsView />
      </div>
    </PageGuard>
  )
}
