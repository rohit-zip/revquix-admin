import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { AdminContactQueryDetailView } from "@/features/contact/admin-contact-query-detail-view"

interface ContactQueryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactQueryDetailPage({ params }: ContactQueryDetailPageProps) {
  const { id } = await params

  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_CONTACT_QUERIES]}>
      <div className="container max-w-4xl mx-auto p-4">
        <AdminContactQueryDetailView contactQueryId={id} />
      </div>
    </PageGuard>
  )
}
