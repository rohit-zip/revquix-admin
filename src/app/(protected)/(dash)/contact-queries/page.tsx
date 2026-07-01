import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { AdminContactQueriesView } from "@/features/contact/admin-contact-queries-view"

export default function ContactQueriesPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CONTACT_QUERIES]}>
      <div className="container max-w-7xl mx-auto p-4">
        <AdminContactQueriesView />
      </div>
    </PageGuard>
  )
}
