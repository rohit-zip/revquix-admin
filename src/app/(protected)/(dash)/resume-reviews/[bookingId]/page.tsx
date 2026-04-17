import PageGuard from "@/components/page-guard"
import AdminResumeReviewDetailView from "@/features/resume-review/resume-review-detail-view"

interface Props {
  params: Promise<{ bookingId: string }>
}

export default async function AdminResumeReviewDetailPage({ params }: Props) {
  const { bookingId } = await params

  return (
    <PageGuard>
      <AdminResumeReviewDetailView bookingId={bookingId} />
    </PageGuard>
  )
}

