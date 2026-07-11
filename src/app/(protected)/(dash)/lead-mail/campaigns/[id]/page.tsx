import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { LeadMailCampaignDetailView } from "@/features/lead-mail/lead-mail-campaign-detail-view"

interface LeadMailCampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadMailCampaignDetailPage({ params }: LeadMailCampaignDetailPageProps) {
  const { id } = await params

  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL]}>
      <div className="container max-w-5xl mx-auto p-4">
        <LeadMailCampaignDetailView campaignId={id} />
      </div>
    </PageGuard>
  )
}
