import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { NewsCategoriesView } from "@/features/news/news-categories-view"

export default function NewsCategoriesPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL]}>
      <div className="container mx-auto max-w-5xl p-4">
        <NewsCategoriesView />
      </div>
    </PageGuard>
  )
}
