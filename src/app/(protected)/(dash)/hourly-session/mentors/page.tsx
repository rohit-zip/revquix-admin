import PageGuard from "@/components/page-guard"
import HourlySessionMentorBrowseView from "@/features/hourly-session/mentor-browse-view"

export default function HourlySessionMentorsPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4">
        <HourlySessionMentorBrowseView />
      </div>
    </PageGuard>
  )
}
