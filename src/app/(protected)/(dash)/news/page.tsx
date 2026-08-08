import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { NewsOverviewView } from "@/features/news/news-overview-view"

export default function NewsPage() {
  return (
    <PageGuard
      requireAnyAuthority={[
        PERMISSIONS.ROLE_ADMIN,
        PERMISSIONS.PERM_WRITE_EDITORIAL,
        PERMISSIONS.PERM_MANAGE_EDITORIAL,
      ]}
    >
      <div className="container mx-auto max-w-7xl p-4">
        <NewsOverviewView />
      </div>
    </PageGuard>
  )
}
