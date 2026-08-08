import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { NewsEndStripsView } from "@/features/news/news-end-strips-view"

export default function NewsEndStripsPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL]}>
      <div className="container mx-auto max-w-5xl p-4">
        <NewsEndStripsView />
      </div>
    </PageGuard>
  )
}
