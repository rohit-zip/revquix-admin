import PageGuard from "@/components/page-guard"
import { AdminBlogDetailView } from "@/features/blog/admin-blog-detail-view"

interface BlogDetailPageProps {
  params: Promise<{ blogId: string }>
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { blogId } = await params

  return (
    <PageGuard>
      <div className="container max-w-4xl mx-auto p-4">
        <AdminBlogDetailView blogId={blogId} />
      </div>
    </PageGuard>
  )
}
