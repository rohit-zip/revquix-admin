import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { LeadMailCampaignsView } from "@/features/lead-mail/lead-mail-campaigns-view"

export const metadata = {
  title: "Campaigns | Lead Mailer | Revquix Admin",
}

/**
 * Campaign history (requirement 6) — now the landing page for the Lead Mailer.
 *
 * This route previously mounted the compose form, which has moved to /lead-mail/compose. History is
 * the better default: an operator arriving at the Lead Mailer is far more often checking how a send
 * went than starting a new one, and until this page existed there was no way to see past campaigns at
 * all.
 */
export default function LeadMailCampaignsPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL]}>
      <div className="container mx-auto max-w-6xl space-y-1 p-4">
        <div>
          <h1 className="text-xl font-semibold">Lead Mailer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Past and in-flight outreach campaigns, with their delivery reports.
          </p>
        </div>
        <div className="pt-4">
          <LeadMailCampaignsView />
        </div>
      </div>
    </PageGuard>
  )
}
