import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { LeadMailComposeView } from "@/features/lead-mail/lead-mail-compose-view"

export const metadata = {
  title: "Lead Mailer | Revquix Admin",
}

export default function LeadMailPage() {
  return (
    <PageGuard requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_SEND_LEAD_MAIL]}>
      <div className="container max-w-5xl mx-auto space-y-1 p-4">
        <div>
          <h1 className="text-xl font-semibold">Lead Mailer</h1>
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
