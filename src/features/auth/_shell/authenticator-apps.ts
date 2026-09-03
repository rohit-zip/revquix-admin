/**
 * ─── THE AUTHENTICATOR CATALOGUE ─────────────────────────────────────────────
 *
 * The closed set of apps an admin can tell us they set up on the forced-enrolment screen.
 *
 * ─── ⚠ Twin of `revquix-web/src/features/dashboard/user/components/mfa/authenticator-apps.ts` ──
 *
 * The two repos share no package. Both write to the same column through the same enum, so the ids
 * here MUST stay identical to the web copy and to `MfaAuthenticatorApp` in the backend — an id the
 * server does not know is rejected outright.
 *
 * ─── Why a closed set and not a text field ───────────────────────────────────
 *
 * TOTP is deliberately app-agnostic: the server issues a secret and receives six digits, and nothing
 * in the protocol says which app produced them. So the only way to answer "which app did I use?" is
 * to record what the member told us at setup — which makes it self-reported, and means no surface
 * may present it as something Revquix verified. A fixed set of ids removes the sanitising question
 * entirely and lets the display name change here without a migration.
 */

/** Ids are the wire format. They must match `com.revquix.backend.enums.MfaAuthenticatorApp`. */
export type AuthenticatorAppId =
  | "GOOGLE_AUTHENTICATOR"
  | "MICROSOFT_AUTHENTICATOR"
  | "APPLE_PASSWORDS"
  | "ONE_PASSWORD"
  | "BITWARDEN"
  | "AUTHY"
  | "PROTON_PASS"
  | "ENTE_AUTH"
  | "OTHER"

export interface AuthenticatorApp {
  id: AuthenticatorAppId
  /** What the member sees. Safe to change — the id is what is stored. */
  name: string
  /** One or two letters for the tile. Brand marks are deliberately not used: shipping eight
   *  companies' logos into our bundle is a trademark question we have no reason to open. */
  monogram: string
  /**
   * ⚠ Literal Tailwind classes, never composed from a token at runtime. Tailwind v4 scans source
   * text, so `bg-${tone}-500/10` produces no CSS at all and the tile renders untinted.
   */
  tone: string
}

export const AUTHENTICATOR_APPS: AuthenticatorApp[] = [
  {
    id: "GOOGLE_AUTHENTICATOR",
    name: "Google Authenticator",
    monogram: "G",
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "MICROSOFT_AUTHENTICATOR",
    name: "Microsoft Authenticator",
    monogram: "M",
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    id: "APPLE_PASSWORDS",
    name: "Apple Passwords",
    monogram: "A",
    tone: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  {
    id: "ONE_PASSWORD",
    name: "1Password",
    monogram: "1P",
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "BITWARDEN",
    name: "Bitwarden",
    monogram: "B",
    tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "AUTHY",
    name: "Authy",
    monogram: "Ay",
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    id: "PROTON_PASS",
    name: "Proton Pass",
    monogram: "P",
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    id: "ENTE_AUTH",
    name: "Ente Auth",
    monogram: "E",
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "OTHER",
    name: "Another app",
    monogram: "•••",
    tone: "bg-muted text-muted-foreground",
  },
]

const BY_ID = new Map(AUTHENTICATOR_APPS.map((app) => [app.id, app]))

/** Looks up an app by id, returning null for anything this build has never heard of. */
export function findAuthenticatorApp(id: string | null | undefined): AuthenticatorApp | null {
  if (!id) return null
  return BY_ID.get(id as AuthenticatorAppId) ?? null
}
