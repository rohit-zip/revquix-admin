/**
 * ─── USE RAZORPAY HOOK ───────────────────────────────────────────────────────
 *
 * Dynamically loads the Razorpay checkout.js script and exposes an
 * `openCheckout` callback for opening the payment modal.
 *
 * Usage:
 *   const { isLoaded, openCheckout } = useRazorpay()
 *   openCheckout({ key, amount, currency, order_id, handler, ... })
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import type { RazorpayOptions } from "../api/payment.types"

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Already loaded
    if (document.getElementById("razorpay-script")) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.id = "razorpay-script"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => console.error("Failed to load Razorpay SDK")
    document.body.appendChild(script)
  }, [])

  const openCheckout = useCallback(
    (options: RazorpayOptions) => {
      if (!isLoaded || typeof window === "undefined") {
        console.error("Razorpay SDK not loaded yet")
        return
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    },
    [isLoaded],
  )

  return { isLoaded, openCheckout }
}

