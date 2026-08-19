"use client"

import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import GoogleMeetIntegrationView from "@/features/google-meet/google-meet-integration-view"

/**
 * The operator surface for the Google accounts Revquix mints Meet rooms from.
 *
 * Route matches PlatformMeetOAuthController's post-consent redirect (`/platform/google-meet`), so
 * an operator returning from Google lands back here rather than on the console root.
 */
export default function Page() {
  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_MANAGE_MEET_INTEGRATION]}
    >
      <GoogleMeetIntegrationView />
    </PageGuard>
  )
}
