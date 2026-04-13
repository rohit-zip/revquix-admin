"use client"

import { useSelector } from "react-redux"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import type { RootState } from "@/core/store"

/**
 * Full-page loader that shows while auth status is being checked
 * Features:
 * - Pulsating Revquix logo (center)
 * - Subtle loading message
 * - Smooth fade in/out transitions
 * - Blocks all interactions while checking
 */
export default function AuthCheckLoader() {
  const { isAuthChecking } = useSelector(
    (state: RootState) => state.authInitialization,
  )

  return (
    <AnimatePresence mode="wait">
      {isAuthChecking ? (
        <motion.div
          key="auth-loader"
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
              <p className="text-sm font-medium text-foreground">
                Loading your account
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please wait...
              </p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}


