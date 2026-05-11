import PageGuard from "@/components/page-guard"
import AdminAllMentorsView from "@/features/professional-mentor/admin-all-mentors-view"

export default function AdminAllMentorsPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4">
        <AdminAllMentorsView />
      </div>
    </PageGuard>
  )
}
