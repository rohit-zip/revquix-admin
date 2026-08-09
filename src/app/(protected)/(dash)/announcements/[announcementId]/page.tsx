import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { AnnouncementDetailView } from "@/features/announcements/announcement-detail-view"

export const metadata = {
  title: "Announcement analytics | Revquix Admin",
}

interface AnnouncementDetailPageProps {
  params: Promise<{ announcementId: string }>
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { announcementId } = await params

  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_ANNOUNCEMENTS]}
      label="Announcements"
    >
      <div className="container mx-auto max-w-6xl p-4">
        <AnnouncementDetailView announcementId={announcementId} />
      </div>
    </PageGuard>
  )
}
