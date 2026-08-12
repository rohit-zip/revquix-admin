/**
 * ─── EMAIL SUPPRESSION API ────────────────────────────────────────────────────
 *
 * The marketing do-not-mail list. All paths are relative to the apiClient baseURL (/api/v1).
 *
 * Every endpoint here sits behind `PERM_MANAGE_EMAIL_SUPPRESSION` (or `ROLE_ADMIN`) — deliberately
 * NOT `PERM_SEND_LEAD_MAIL`. Somebody who can run a campaign should not automatically be able to
 * lift the opt-outs that constrain it.
 */

import { apiClient } from "@/lib/axios"
import type { EmailSuppression, SuppressionPage } from "./suppression.types"

const BASE = "/admin/email-suppression"

/** GET /admin/email-suppression — active entries, newest first. */
export const getSuppressions = (page = 0, size = 50): Promise<SuppressionPage> =>
  apiClient.get<SuppressionPage>(BASE, { params: { page, size } }).then((r) => r.data)

/**
 * GET /admin/email-suppression/history — every row for one address, active or not.
 *
 * The audit trail. An address that was suppressed and later reactivated shows both rows, so the
 * console can say "suppressed on the 3rd, reactivated by ADM1 on the 9th" rather than presenting a
 * reactivated address as one that was never on the list.
 */
export const getSuppressionHistory = (email: string): Promise<EmailSuppression[]> =>
  apiClient
    .get<EmailSuppression[]>(`${BASE}/history`, { params: { email } })
    .then((r) => r.data)

/** POST /admin/email-suppression — add by hand. 409s if the address is already suppressed. */
export const addSuppression = (body: {
  email: string
  note?: string
}): Promise<EmailSuppression> =>
  apiClient.post<EmailSuppression>(BASE, body).then((r) => r.data)

/**
 * POST /admin/email-suppression/{id}/reactivate — audited un-suppress.
 *
 * Deactivates the row and stamps who did it; nothing is deleted. Use only with the recipient's
 * consent — this is the action that lets Revquix mail someone who asked it not to.
 */
export const reactivateSuppression = (suppressionId: string): Promise<EmailSuppression> =>
  apiClient
    .post<EmailSuppression>(`${BASE}/${suppressionId}/reactivate`)
    .then((r) => r.data)

/**
 * Downloads the active list as CSV and hands it to the browser.
 *
 * Fetched through `apiClient` rather than by pointing an anchor at the URL: the endpoint needs the
 * bearer token that only the axios interceptor attaches, and a plain navigation would arrive
 * unauthenticated and render a 401 page. Same shape as
 * `downloadLeadMailCampaignRecipientsCsv` — including revoking the object URL, because skipping
 * that leaks the whole blob for the life of the document.
 */
export const downloadSuppressionCsv = async (): Promise<void> => {
  const response = await apiClient.get<Blob>(`${BASE}/export.csv`, { responseType: "blob" })

  const disposition = String(response.headers?.["content-disposition"] ?? "")
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : "email-suppression.csv"

  const url = URL.createObjectURL(response.data)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
