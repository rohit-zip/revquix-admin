import PageGuard from "@/components/page-guard"
import HourlySessionMentorDetailView from "@/features/hourly-session/mentor-detail-view"

interface Props {
  params: Promise<{ mentorProfileId: string }>
}

export default async function HourlySessionMentorDetailPage({ params }: Props) {
  const { mentorProfileId } = await params
  return (
    <PageGuard>
      <div className="container max-w-5xl mx-auto p-4">
        <HourlySessionMentorDetailView mentorProfileId={mentorProfileId} />
      </div>
    </PageGuard>
  )
}
