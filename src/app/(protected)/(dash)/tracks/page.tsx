import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { TrackListView } from "@/features/coding-tracks/track-list-view"

export const metadata = {
  title: "Tracks",
}

export default function TracksPage() {
  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_PUBLISH_PROBLEM]}
      label="Tracks"
    >
      <div className="container mx-auto max-w-6xl p-4">
        <TrackListView />
      </div>
    </PageGuard>
  )
}
