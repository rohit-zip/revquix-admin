import { notFound } from "next/navigation"
import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { EDITORIAL_ENABLED } from "@/core/constants/feature-flags"
import { NewsOverviewView } from "@/features/news/news-overview-view"

export default function NewsPage() {
  if (!EDITORIAL_ENABLED) notFound()
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
