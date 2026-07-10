import { notFound } from "next/navigation"
import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { EDITORIAL_ENABLED } from "@/core/constants/feature-flags"
import { NewsLandingView } from "@/features/news/news-landing-view"

export default function NewsLandingPage() {
  if (!EDITORIAL_ENABLED) notFound()
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL]}>
      <div className="container mx-auto max-w-4xl p-4">
        <NewsLandingView />
      </div>
    </PageGuard>
  )
}
