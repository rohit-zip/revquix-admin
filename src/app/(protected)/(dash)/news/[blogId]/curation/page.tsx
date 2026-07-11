import { notFound } from "next/navigation"
import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { EDITORIAL_ENABLED } from "@/core/constants/feature-flags"
import { NewsCurationView } from "@/features/news/news-curation-view"

interface NewsCurationPageProps {
  params: Promise<{ blogId: string }>
}

export default async function NewsCurationPage({ params }: NewsCurationPageProps) {
  if (!EDITORIAL_ENABLED) notFound()
  const { blogId } = await params
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_EDITORIAL]}>
      <div className="container mx-auto max-w-4xl p-4">
        <NewsCurationView blogId={blogId} />
      </div>
    </PageGuard>
  )
}
