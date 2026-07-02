import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { AssetManagerView } from "@/features/asset-manager/asset-manager-view"

export default function AssetsPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_ASSETS]}>
      <div className="container mx-auto max-w-7xl p-4">
        <AssetManagerView />
      </div>
    </PageGuard>
  )
}
