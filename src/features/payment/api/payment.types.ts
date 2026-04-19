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
  RESUME_REVIEW: "RESUME_REVIEW",
  CAREER_COACHING: "CAREER_COACHING",
  GROUP_WORKSHOP: "GROUP_WORKSHOP",
  SUBSCRIPTION: "SUBSCRIPTION",
} as const
export type PaymentContext = (typeof PAYMENT_CONTEXT)[keyof typeof PAYMENT_CONTEXT]

// ─── Responses ────────────────────────────────────────────────────────────────

export interface PaymentOrderResponse {
  paymentOrderId: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  currency: CurrencyCode
  amountMinor: number
  paymentContext: PaymentContext
  contextEntityId: string
  status: PaymentStatus
  failureReason: string | null
  paymentMethod: string | null
  paymentMethodDetail: string | null
  payerEmail: string | null
  payerContact: string | null
  razorpayFee: number | null
  razorpayTax: number | null
  upiVpa: string | null
  cardNetwork: string | null
  cardType: string | null
  cardLast4: string | null
  cardIssuer: string | null
  bankName: string | null
  walletName: string | null
  appliedCouponCode: string | null
  discountAmountMinor: number | null
  razorpayRefundId: string | null
  refundAmountMinor: number | null
  refundedAt: string | null
  createdAt: string
  capturedAt: string | null
  failedAt: string | null
  // ── User info (for admin views) ─────────────────────────────────────
  userId: string | null
  userName: string | null
  userEmail: string | null
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


