/**
 * ─── ADMIN INTAKE TYPES ───────────────────────────────────────────────────────
 */

export type IntakeCategory =
  | "BUSINESS_STARTUP"
  | "PROFESSIONAL_DEVELOPER"
  | "HIRING_RECRUITMENT"

export interface IntakeResponse {
  intakeId: string
  userId: string
  fullName: string
  email: string
  category: IntakeCategory | null
  isUsed: boolean
  isActionTaken: boolean
  actionNote: string | null
  createdAt: string  // ISO-8601 UTC
}

export interface IntakeActionRequest {
  actionNote?: string
}

