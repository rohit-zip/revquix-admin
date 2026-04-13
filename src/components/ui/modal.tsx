"use client"

import React, { useCallback, useEffect, useId } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Modal content */
  children: React.ReactNode
  /** Optional accessible title (used by aria-labelledby) */
  title?: string
  /** Size variant — sm | md | lg | xl | 2xl | 3xl | 4xl | 5xl | full */
  size?: ModalSize
  /** Show the close (×) button in the top-right corner */
  showCloseButton?: boolean
  /** Close modal when the backdrop is clicked */
  closeOnBackdropClick?: boolean
  /** Additional className applied to the panel */
  className?: string
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full mx-4",
}

// ─── Animation variants ───────────────────────────────────────────────────────

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
}

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.18, ease: "easeIn" as const },
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
}: ModalProps) {
  const titleId = useId()

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = "hidden"
    document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [open])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, handleKeyDown])


  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        // ── Backdrop ──────────────────────────────────────────────────────────
        <motion.div
          key="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className="fixed inset-0 z-9999 flex items-end justify-center p-4 sm:items-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* ── Panel ──────────────────────────────────────────────────────── */}
          <motion.div
            key="modal-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              // Base layout
              "relative z-10 flex w-full flex-col",
              // Shape & surface
              "rounded-2xl sm:rounded-3xl border border-border/60",
              "bg-card text-card-foreground shadow-2xl",
              // Max-height: leave breathing room on mobile (bottom-sheet style) and desktop
              "max-h-[92dvh] sm:max-h-[88dvh]",
              // Ring highlight at top
              "ring-1 ring-inset ring-white/5",
              SIZE_CLASSES[size],
              className
            )}
            // Stop clicks from bubbling to backdrop
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative top gradient line */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl sm:rounded-t-3xl bg-linear-to-r from-transparent via-primary-400/60 to-transparent" />

            {/* Close button */}
            {showCloseButton && (
              <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className={cn(
                  "absolute right-3 top-3 z-10 sm:right-4 sm:top-4",
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-muted/70 text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Hidden accessible title anchor */}
            {title && (
              <span id={titleId} className="sr-only">
                {title}
              </span>
            )}

            {/* Content — scrollable */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ─── Convenience sub-components ──────────────────────────────────────────────

export function ModalHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "shrink-0 px-5 pb-3 pt-5 sm:px-6 sm:pt-6",
        // leave room for close button on the right
        "pr-12 sm:pr-14",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-5 pb-2 sm:px-6", className)}>
      {children}
    </div>
  )
}

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-border/50 px-5 py-4 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}

