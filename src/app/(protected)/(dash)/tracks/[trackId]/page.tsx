import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { TrackEditorView } from "@/features/coding-tracks/track-editor-view"

export const metadata = {
  title: "Track",
}

export default async function TrackEditorPage({
  params,
}: {
  params: Promise<{ trackId: string }>
}) {
  const { trackId } = await params
  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_PUBLISH_PROBLEM]}
      label="Track"
    >
      <div className="container mx-auto max-w-5xl p-4">
        <TrackEditorView trackId={trackId} />
      </div>
    </PageGuard>
  )
}
