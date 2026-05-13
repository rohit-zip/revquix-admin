import PageGuard from "@/components/page-guard"
import { AdminBlogReportsView } from "@/features/blog/admin-blog-reports-view"

export default function BlogReportsPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4">
        <AdminBlogReportsView />
      </div>
    </PageGuard>
  )
}
