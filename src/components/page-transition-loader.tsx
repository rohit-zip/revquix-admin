"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import CentralizedLoader from "@/components/centralized-loader"

/**
 * PageTransitionLoader — Dashboard Route Transition Overlay
 *
 * Listens to pathname changes inside the dashboard and shows the branded
 * CentralizedLoader overlay during cross-section navigation.
 *
 * Design decisions:
 * - Only shows if navigation takes longer than THRESHOLD_MS (avoids flash on
 *   instant/cached navigations on fast connections or repeat visits).
 * - Auto-clears after MAX_DURATION_MS so it never blocks the UI permanently.
 * - Scoped to /(protected)/(dash)/layout — sidebar always stays visible.
 *
 * Usage: render once inside DashLayout / DashShell.
 */

const THRESHOLD_MS = 150    // Don't show loader for blazing-fast hops
const MAX_DURATION_MS = 1800 // Safety valve — always clears eventually

export default function PageTransitionLoader() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstMount = useRef(true)

  useEffect(() => {
    // Skip the very first render — we don't want a loader on initial page load
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    // Clear any previous timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)

    // Start threshold timer — only show loader if we're still loading after THRESHOLD_MS
    timerRef.current = setTimeout(() => {
      setIsVisible(true)

      // Safety: always clear after MAX_DURATION_MS
      maxTimerRef.current = setTimeout(() => {
        setIsVisible(false)
      }, MAX_DURATION_MS)
    }, THRESHOLD_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
      setIsVisible(false)
    }
  }, [pathname])

  return (
    <CentralizedLoader
      isVisible={isVisible}
      message="Loading"
      subMessage=""
    />
  )
}

