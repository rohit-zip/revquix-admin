import PageGuard from "@/components/page-guard"
import { AdminBlogsView } from "@/features/blog/admin-blogs-view"

export default function BlogsPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4">
        <AdminBlogsView />
      </div>
    </PageGuard>
  )
}
