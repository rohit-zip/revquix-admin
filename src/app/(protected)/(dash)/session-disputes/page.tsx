import PageGuard from "@/components/page-guard"
import { AdminDisputesView } from "@/features/session-disputes/admin-disputes-view"

export default function SessionDisputesPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4">
        <AdminDisputesView />
      </div>
    </PageGuard>
  )
}
