"use client"

import Link from "next/link"
import { Home, FileQuestion } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-5 py-20 text-center">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ contain: "strict" }}
      >
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary-500/15 blur-[130px] dark:bg-primary-400/10" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
        <div className="inline-flex rounded-full border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/40">
          <span className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-700 dark:text-primary-300 sm:text-sm">
            <FileQuestion className="h-3.5 w-3.5" />
            Page Not Found
          </span>
        </div>

        <div className="relative select-none font-extrabold leading-none tracking-tighter text-foreground">
          <span className="relative z-10 block text-[7rem] sm:text-[10rem] lg:text-[13rem]">
            404
          </span>
        </div>

        <h1 className="-mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          This page doesn&apos;t exist
        </h1>

        <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          The admin page you&apos;re looking for may have been moved or deleted.
        </p>

        <Link href="/">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-primary-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all",
              "hover:bg-primary-600",
            )}
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </div>
        </Link>
      </div>
    </div>
  )
}

