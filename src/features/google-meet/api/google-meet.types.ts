/**
 * ─── PLATFORM GOOGLE MEET INTEGRATION ───────────────────────────────────────
 *
 * Types for PlatformMeetOAuthController. These describe the Google accounts REVQUIX owns and mints
 * Meet rooms from - not a mentor's calendar connection, which is a different feature with a
 * different scope and a different blast radius.
 */

export interface PlatformMeetAccount {
  meetAccountId: string
  googleEmail: string
  /** PRIMARY is an administrative PREFERENCE. The runtime still skips an unhealthy primary. */
  role: "PRIMARY" | "STANDBY" | string
  status: "ACTIVE" | "DEGRADED" | "DISCONNECTED" | string
  /** Google says the grant is gone. Only a human re-consenting fixes it. */
  requiresReauth: boolean
  /**
   * The stored credential cannot be decrypted with this environment's key.
   *
   * A LOCAL problem - a rotated encryption key, a restored backup - not anything that happened at
   * Google. An operator sent to Google to fix this will waste an afternoon, so it is rendered
   * differently from `requiresReauth`.
   */
  credentialUnreadable: boolean
  /** Whether this account would mint the next room. Computed server-side so it cannot drift. */
  selectedForNextRoom: boolean
  lastHealthyAt: string | null
  lastUsedAt: string | null
  lastError: string | null
  lastErrorAt: string | null
  spacesCreatedCount: number
  /** Creates spent against the per-minute ceiling right now. The ceiling is MEASURED at 10. */
  budgetUsedInWindow: number
  budgetCeiling: number
  connectedByUserId: string | null
  connectedAt: string | null
}

export interface PlatformMeetStatus {
  healthy: boolean
  message: string
}

/**
 * The round-trip result.
 *
 * `grantedAccessType` is the field that matters most. Anything other than OPEN means uninvited
 * joiners must knock - and since nobody from Revquix is ever in the room, nobody can admit them.
 * Every booking on this path would break at the door, and nothing else in the system would notice.
 */
export interface MeetRoundTripResult {
  success: boolean
  googleEmail: string | null
  accountId: string | null
  spaceName: string | null
  grantedAccessType: string | null
  accessTypeAsRequested: boolean
  readBackOk: boolean
  conferenceWasActive: boolean
  budgetUsedInWindow: number
  budgetCeiling: number
  steps: string[]
  failureMessage: string | null
  /** Always populated: Google offers no way to delete a space, so each test leaves one behind. */
  warning: string | null
}
