import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { AnnouncementsView } from "@/features/announcements/announcements-view"

export const metadata = {
  title: "Announcements | Revquix Admin",
}

export default function AnnouncementsPage() {
  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_ANNOUNCEMENTS]}
      label="Announcements"
    >
      <div className="container mx-auto max-w-6xl p-4">
        <AnnouncementsView />
      </div>
    </PageGuard>
  )
}
