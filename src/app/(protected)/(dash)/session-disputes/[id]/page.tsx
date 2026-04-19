import PageGuard from "@/components/page-guard"
import { AdminDisputeDetailView } from "@/features/session-disputes/admin-dispute-detail-view"

interface DisputeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DisputeDetailPage({ params }: DisputeDetailPageProps) {
  const { id } = await params

  return (
    <PageGuard>
      <div className="container max-w-3xl mx-auto p-4">
        <AdminDisputeDetailView disputeId={id} />
      </div>
    </PageGuard>
  )
}
