/**
 * ─── PAYMENT INVOICE ──────────────────────────────────────────────────────────
 *
 * A print-optimised invoice component rendered inside a hidden wrapper.
 * The parent calls `printInvoice()` to open the browser print dialog
 * scoped to the invoice content only.
 */

"use client"

import React, { useCallback } from "react"
import type { PaymentOrderResponse } from "./api/payment.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    CREATED: "Created",
    AUTHORIZED: "Authorized",
    CAPTURED: "Paid",
    FAILED: "Failed",
    REFUND_INITIATED: "Refund Initiated",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partially Refunded",
  }
  return map[status] ?? status
}

function getPaymentMethodLabel(method: string | null, detail: string | null) {
  if (!method) return "—"
  const labels: Record<string, string> = {
    upi: "UPI",
    card: "Card",
    netbanking: "Net Banking",
    wallet: "Wallet",
    emi: "EMI",
  }
  const label = labels[method] ?? method
  return detail ? `${label} (${detail})` : label
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  label: string
  amountMinor: number
}

interface PaymentInvoiceProps {
  payment: PaymentOrderResponse
  /** Human-readable item title for the Description cell (falls back to the payment-context label). */
  itemName?: string
  /** Optional itemised breakdown (e.g. plan + add-ons). When present, one row per line item is rendered. */
  lineItems?: InvoiceLineItem[]
  children: (printInvoice: () => void) => React.ReactNode
}

export default function PaymentInvoice({ payment, itemName, lineItems, children }: PaymentInvoiceProps) {
  const invoiceId = `invoice-${payment.paymentOrderId}`

  const printInvoice = useCallback(() => {
    const invoiceEl = document.getElementById(`invoice-${payment.paymentOrderId}`)
    if (!invoiceEl) return

    const printWindow = window.open("", "_blank", "width=800,height=900")
    if (!printWindow) return

    const content = invoiceEl.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Invoice ${payment.paymentOrderId}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
          .company-info h1 { font-size: 24px; font-weight: 700; color: #111827; }
          .company-info p { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .invoice-meta { text-align: right; }
          .invoice-meta h2 { font-size: 20px; font-weight: 600; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
          .invoice-meta p { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .invoice-meta .invoice-id { font-family: monospace; font-size: 13px; color: #374151; font-weight: 500; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-box { background: #f9fafb; border-radius: 6px; padding: 12px 16px; }
          .info-box .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
          .info-box .value { font-size: 14px; font-weight: 500; color: #111827; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #f3f4f6; padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; border-bottom: 1px solid #e5e7eb; }
          thead th:last-child { text-align: right; }
          tbody td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f3f4f6; color: #374151; }
          tbody td:last-child { text-align: right; font-weight: 500; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
          .totals-table { width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .totals-row .label { color: #6b7280; }
          .totals-row .value { font-weight: 500; color: #374151; }
          .totals-row.discount .value { color: #059669; }
          .totals-row.total { border-top: 2px solid #111827; padding-top: 10px; margin-top: 6px; font-size: 15px; font-weight: 700; }
          .totals-row.total .label, .totals-row.total .value { color: #111827; }
          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          .status-refunded { background: #dbeafe; color: #1e40af; }
          .status-pending { background: #f3f4f6; color: #374151; }
          .payment-info { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .payment-info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
          .payment-info-row .label { color: #6b7280; }
          .payment-info-row .value { color: #374151; font-weight: 500; font-family: monospace; font-size: 11px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
          .footer p { font-size: 11px; color: #9ca3af; }
          .footer .note { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
          @media print { body { padding: 20px; } @page { margin: 15mm; } }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `)

    printWindow.document.close()
    // Allow styles to load before printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }, [payment.paymentOrderId])

  const statusClass = (() => {
    switch (payment.status) {
      case "CAPTURED": return "status-paid"
      case "FAILED": return "status-failed"
      case "REFUNDED":
      case "REFUND_INITIATED":
      case "PARTIALLY_REFUNDED": return "status-refunded"
      default: return "status-pending"
    }
  })()

  const hasDiscount = payment.discountAmountMinor != null && payment.discountAmountMinor > 0
  const grossAmount = hasDiscount
    ? payment.amountMinor + payment.discountAmountMinor!
    : payment.amountMinor

  return (
    <>
      {children(printInvoice)}

      {/* Hidden invoice content — only used for printing */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div id={invoiceId}>
          {/* Header */}
          <div className="invoice-header">
            <div className="company-info">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <svg width="36" height="36" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Revquix logo">
                  <circle cx="16" cy="16" r="16" fill="#006fee" />
                  <path
                    d="M10.5 24.638l3.467-1.812V10.745l4.952 2.778-3.714 1.933v3.987L23.5 25v-3.745l-5.076-3.503 4.209-2.175v-3.866L13.967 7 10.5 8.812z"
                    fill="#ffffff"
                  />
                </svg>
                <h1>Revquix</h1>
              </div>
              <p>Technology &amp; Mentorship Platform</p>
              <p>contact@revquix.com</p>
              <p>www.revquix.com</p>
            </div>
            <div className="invoice-meta">
              <h2>Invoice</h2>
              <p className="invoice-id">{payment.paymentOrderId}</p>
              <p>Date: {formatDate(payment.capturedAt ?? payment.createdAt)}</p>
              <p style={{ marginTop: "8px" }}>
                <span className={`status-badge ${statusClass}`}>
                  {getStatusLabel(payment.status)}
                </span>
              </p>
            </div>
          </div>

          {/* Payer & Payment Info */}
          <div className="info-grid">
            <div className="info-box">
              <div className="label">Billed To</div>
              {payment.userName && (
                <div className="value">{payment.userName}</div>
              )}
              <div className="value" style={payment.userName ? { fontSize: "12px", color: "#6b7280" } : undefined}>{payment.payerEmail ?? payment.userEmail ?? "—"}</div>
              {payment.payerContact && (
                <div className="value" style={{ fontSize: "12px", color: "#6b7280" }}>
                  {payment.payerContact}
                </div>
              )}
            </div>
            <div className="info-box">
              <div className="label">Payment Method</div>
              <div className="value">
                {getPaymentMethodLabel(payment.paymentMethod, payment.paymentMethodDetail)}
              </div>
              {payment.upiVpa && (
                <div className="value" style={{ fontSize: "12px", color: "#6b7280" }}>
                  VPA: {payment.upiVpa}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Booking ID</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems && lineItems.length > 0 ? (
                lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.label}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px" }}>
                      {idx === 0 ? payment.contextEntityId : ""}
                    </td>
                    <td>{formatAmount(item.amountMinor, payment.currency)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{itemName ?? payment.title}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "11px" }}>
                    {payment.contextEntityId}
                  </td>
                  <td>{formatAmount(grossAmount, payment.currency)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <div className="totals-table">
              <div className="totals-row">
                <span className="label">Subtotal</span>
                <span className="value">{formatAmount(grossAmount, payment.currency)}</span>
              </div>
              {hasDiscount && (
                <div className="totals-row discount">
                  <span className="label">
                    Discount{payment.appliedCouponCode ? ` (${payment.appliedCouponCode})` : ""}
                  </span>
                  <span className="value">
                    -{formatAmount(payment.discountAmountMinor!, payment.currency)}
                  </span>
                </div>
              )}
              {payment.gatewayFeeMinor != null && payment.gatewayFeeMinor > 0 && (
                <div className="totals-row">
                  <span className="label">Processing Fee</span>
                  <span className="value">{formatAmount(payment.gatewayFeeMinor, payment.currency)}</span>
                </div>
              )}
              {payment.gatewayTaxMinor != null && payment.gatewayTaxMinor > 0 && (
                <div className="totals-row">
                  <span className="label">Tax (GST)</span>
                  <span className="value">{formatAmount(payment.gatewayTaxMinor, payment.currency)}</span>
                </div>
              )}
              <div className="totals-row total">
                <span className="label">Total Paid</span>
                <span className="value">{formatAmount(payment.amountMinor, payment.currency)}</span>
              </div>
            </div>
          </div>

          {/* Refund info if applicable */}
          {(payment.status === "REFUNDED" || payment.status === "REFUND_INITIATED" || payment.status === "PARTIALLY_REFUNDED") && (
            <div className="payment-info">
              <div className="section-title" style={{ marginBottom: "8px" }}>Refund Information</div>
              {payment.refundAmountMinor != null && payment.refundAmountMinor > 0 && (
                <div className="payment-info-row">
                  <span className="label">Refund Amount</span>
                  <span className="value" style={{ color: "#d97706", fontWeight: 600 }}>
                    {formatAmount(payment.refundAmountMinor, payment.currency)}
                  </span>
                </div>
              )}
              {payment.refundAmountMinor != null && payment.amountMinor > 0 && payment.refundAmountMinor < payment.amountMinor && (
                <div className="payment-info-row">
                  <span className="label">Refund Percentage</span>
                  <span className="value">
                    {Math.round((payment.refundAmountMinor / payment.amountMinor) * 100)}% of paid amount
                  </span>
                </div>
              )}
              {payment.gatewayRefundId && (
                <div className="payment-info-row">
                  <span className="label">Refund ID</span>
                  <span className="value">{payment.gatewayRefundId}</span>
                </div>
              )}
              <div className="payment-info-row">
                <span className="label">Refund Date</span>
                <span className="value">{formatDateTime(payment.refundedAt)}</span>
              </div>
            </div>
          )}

          {/* Transaction IDs */}
          <div className="payment-info">
            <div className="section-title" style={{ marginBottom: "8px" }}>Transaction References</div>
            <div className="payment-info-row">
              <span className="label">Order ID</span>
              <span className="value">{payment.paymentOrderId}</span>
            </div>
            {payment.gatewayOrderId && (
              <div className="payment-info-row">
                <span className="label">{payment.gatewayLabel ?? "Gateway"} Order</span>
                <span className="value">{payment.gatewayOrderId}</span>
              </div>
            )}
            {payment.gatewayPaymentId && (
              <div className="payment-info-row">
                <span className="label">{payment.gatewayLabel ?? "Gateway"} Payment</span>
                <span className="value">{payment.gatewayPaymentId}</span>
              </div>
            )}
            <div className="payment-info-row">
              <span className="label">Date</span>
              <span className="value">{formatDateTime(payment.capturedAt ?? payment.createdAt)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p className="note">
              This is a computer-generated invoice and does not require a signature.
            </p>
            <p>
              Thank you for your payment. For any queries, reach out to contact@revquix.com
            </p>
            <p style={{ marginTop: "4px" }}>© {new Date().getFullYear()} Revquix. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  )
}







