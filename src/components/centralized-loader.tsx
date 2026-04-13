"use client"

import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"

/**
 * Centralized Loader Component
 *
 * Production-ready, reusable loader used across the application.
 * Features:
 * - Pulsating Revquix logo
 * - Customizable main + sub messages
 * - Smooth fade in/out animations
 * - Blocks all interactions while loading
 * - Purpose: Auth check, OAuth flow, or any async operation
 *
 * Usage:
 *   <CentralizedLoader
 *     isVisible={isLoading}
 *     message="Completing sign-in"
 *     subMessage="Authorizing with Google..."
 *   />
 */

export interface CentralizedLoaderProps {
  /** Whether loader is visible */
  isVisible: boolean
  /** Main message (e.g., "Loading your account") */
  message?: string
  /** Sub-message (e.g., "Please wait...") */
  subMessage?: string
}

export default function CentralizedLoader({
  isVisible,
  message = "Loading",
  subMessage = "Please wait...",
}: CentralizedLoaderProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible ? (
        <motion.div
          key="centralized-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto fixed inset-0 z-9999 flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          {/* Center container */}
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Pulsating logo */}
            <div className="animate-pulse">
              <Image
                src="/svg/revquix.svg"
                alt="Revquix"
                width={80}
                height={80}
                priority
                className="drop-shadow-lg"
              />
            </div>

            {/* Loading message */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-center"
            >
              <p className="text-sm font-medium text-foreground">{message}</p>
              {subMessage && (
                <p className="mt-1 text-xs text-muted-foreground">{subMessage}</p>
              )}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

