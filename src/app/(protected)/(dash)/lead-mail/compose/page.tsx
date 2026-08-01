import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { LeadMailComposeView } from "@/features/lead-mail/lead-mail-compose-view"

export const metadata = {
  title: "New Campaign | Lead Mailer | Revquix Admin",
}

/**
 * Compose screen, moved here from /lead-mail so that route can serve campaign history.
 *
 * Note for anyone tracing a broken link: /lead-mail no longer renders this form. Nothing in the app
 * still points at the old location — the nav entry and the post-send redirect were both updated — but
 * an operator's bookmark would land on the history page rather than 404, which is a survivable
 * outcome and the reason no redirect shim was added.
 */
export default function LeadMailComposePage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL]}>
      <div className="container mx-auto max-w-5xl space-y-1 p-4">
        <div>
          <h1 className="text-xl font-semibold">New Campaign</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose and send ad-hoc outreach emails to leads.
          </p>
        </div>
        <div className="pt-4">
          <LeadMailComposeView />
        </div>
      </div>
    </PageGuard>
  )
}
