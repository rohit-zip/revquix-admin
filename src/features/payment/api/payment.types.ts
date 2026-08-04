/**
 * ─── PAYMENT TYPES ────────────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for PaymentController.
 */

import type { CurrencyCode } from "@/features/professional-mentor/api/professional-mentor.types"

// ─── Enums ────────────────────────────────────────────────────────────────────

export const PAYMENT_STATUS = {
  CREATED: "CREATED",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  FAILED: "FAILED",
  REFUND_INITIATED: "REFUND_INITIATED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
} as const
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const PAYMENT_CONTEXT = {
  MOCK_INTERVIEW: "MOCK_INTERVIEW",
  HOURLY_SESSION: "HOURLY_SESSION",
  CAREER_COACHING: "CAREER_COACHING",
  GROUP_WORKSHOP: "GROUP_WORKSHOP",
  SUBSCRIPTION: "SUBSCRIPTION",
  GLOBAL_OFFER_SERVICE: "GLOBAL_OFFER_SERVICE",
  CREDIT_TOPUP: "CREDIT_TOPUP",
  CREDIT_PASS: "CREDIT_PASS",
} as const
export type PaymentContext = (typeof PAYMENT_CONTEXT)[keyof typeof PAYMENT_CONTEXT]

/**
 * Which commerce stack a payment row came from.
 *
 * `LEGACY` rows are backed by `payment_order`; `MENTORSHIP_V2` rows are Professional Mentor V2
 * purchases backed by `mentorship.commerce_order`, projected into the same shape by the backend.
 * Admin *search* only ever returns `LEGACY` (it filters the legacy table directly), but the detail
 * endpoint resolves either id space, so any single-payment view must handle both.
 */
export const PAYMENT_SOURCE = {
  LEGACY: "LEGACY",
  MENTORSHIP_V2: "MENTORSHIP_V2",
} as const
export type PaymentSource = (typeof PAYMENT_SOURCE)[keyof typeof PAYMENT_SOURCE]

// ─── Responses ────────────────────────────────────────────────────────────────

export interface PaymentOrderResponse {
  paymentOrderId: string
  /** Which processor took the payment - `"RAZORPAY"`, `"PAYPAL"`, or `"NONE"`. Always `"RAZORPAY"` on `LEGACY` rows. */
  gateway: string
  /** The processor's name as a human reads it (`"PayPal"`, not `"Paypal"`). Null when `gateway` is `NONE`. */
  gatewayLabel: string | null
  /** The processor's order id. Was `razorpayOrderId`, which held PayPal ids the moment that rail shipped. */
  gatewayOrderId: string | null
  /** The processor's id for the money movement - Razorpay's `pay_…`, PayPal's *capture* id. */
  gatewayPaymentId: string | null
  currency: CurrencyCode
  /** Raw ISO code actually charged. Prefer this over `currency` for display. */
  currencyCode: string | null
  amountMinor: number
  /** Null for `MENTORSHIP_V2` rows. Use `contextLabel` for display. */
  paymentContext: PaymentContext | null
  contextEntityId: string
  status: PaymentStatus
  failureReason: string | null
  paymentMethod: string | null
  paymentMethodDetail: string | null
  payerEmail: string | null
  payerContact: string | null
  /** What the processor charged the platform, in minor units. Deducted from settlement, never added to the buyer's charge. */
  gatewayFeeMinor: number | null
  /** Tax on `gatewayFeeMinor`. Razorpay reports it separately; PayPal folds it into the fee and leaves this null. */
  gatewayTaxMinor: number | null
  upiVpa: string | null
  cardNetwork: string | null
  cardType: string | null
  cardLast4: string | null
  cardIssuer: string | null
  bankName: string | null
  walletName: string | null
  appliedCouponCode: string | null
  discountAmountMinor: number | null
  /** The processor's refund id, for the most recent refund on this payment. */
  gatewayRefundId: string | null
  refundAmountMinor: number | null
  refundedAt: string | null
  createdAt: string
  capturedAt: string | null
  failedAt: string | null
  // ── User info (for admin views) ─────────────────────────────────────
  userId: string | null
  userName: string | null
  userEmail: string | null
  // ── Unified history metadata ────────────────────────────────────────
  source: PaymentSource
  /** What was purchased, in words. Server-resolved; never a raw enum constant. */
  title: string
  subtitle: string | null
  /** Human label for the purchase category. Populated for both sources. */
  contextLabel: string
  orderNumber: string | null
  platformFeeMinor: number | null
  listAmountMinor: number | null
  mentorName: string | null
  bookingId: string | null
}

export interface PaymentWebhookLogResponse {
  id: number
  eventId: string
  eventType: string
  razorpayPaymentId: string | null
  razorpayOrderId: string | null
  isProcessed: boolean
  processingError: string | null
  attemptCount: number
  rawPayload: string | null
  createdAt: string
  updatedAt: string | null
}

// ─── Admin search ─────────────────────────────────────────────────────────────

export interface AdminPaymentSearchResponse {
  content: PaymentOrderResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export interface RazorpayCheckoutInstrument {
  method: "card" | "upi" | "netbanking" | "wallet" | "emi" | "paylater"
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  prefill?: {
    email?: string
    name?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  config?: {
    display?: {
      blocks?: Record<string, {
        name: string
        instruments: RazorpayCheckoutInstrument[]
      }>
      sequence?: string[]
      preferences?: {
        show_default_blocks?: boolean
      }
    }
  }
}

export interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// ─── Mentor Wallet ────────────────────────────────────────────────────────────

export interface MentorWalletSummaryResponse {
  mentorUserId: string
  mentorName: string
  mentorEmail: string
  mentorProfileId: string | null
  customCommissionPercentage: number | null
  totalInterviewsConducted: number
  totalEarningsMinor: number
  totalPaidOutMinor: number
  pendingPayoutMinor: number
  processingPayoutMinor: number
  onHoldPayoutMinor: number
  currentBalanceMinor: number
  totalPayoutRecords: number
  currency: CurrencyCode
}

// ─── Mentor Payout Accounts ───────────────────────────────────────────────────

export type PayoutAccountType = "BANK_ACCOUNT" | "UPI"

export interface PayoutAccountResponse {
  payoutAccountId: string
  mentorUserId: string
  accountType: PayoutAccountType
  displayName: string | null
  isPrimary: boolean
  isVerified: boolean
  // Bank account fields
  accountHolderName: string | null
  bankName: string | null
  maskedAccountNumber: string | null
  ifscCode: string | null
  bankAccountType: string | null
  // UPI fields
  upiId: string | null
  // Audit
  createdAt: string
  updatedAt: string
}

/** Admin-only: full (unmasked) payout account details for fund transfer processing */
export interface AdminPayoutAccountDetailResponse {
  payoutAccountId: string
  mentorUserId: string
  accountType: PayoutAccountType
  displayName: string | null
  isPrimary: boolean
  isVerified: boolean
  // Bank account fields (full, unmasked)
  accountHolderName: string | null
  bankName: string | null
  accountNumber: string | null
  ifscCode: string | null
  bankAccountType: string | null
  // UPI fields
  upiId: string | null
  // Audit
  createdAt: string
  updatedAt: string
}

export interface PayoutAccountRequest {
  accountType: PayoutAccountType
  displayName?: string
  isPrimary?: boolean
  // Bank fields
  accountHolderName?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  bankAccountType?: "SAVINGS" | "CURRENT"
  // UPI fields
  upiId?: string
}

