"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

/**
 * Moved: the payouts queue is now the first tab of /professional-mentor/payouts.
 *
 * Kept because this path is bookmarked. `replace`, not `push`, so the back button does not bounce.
 */
export default function Page() {
  const router = useRouter()
  useEffect(() => {
    router.replace(PATH_CONSTANTS.ADMIN_PM_PAYOUTS)
  }, [router])

  return (
    <p className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Redirecting…
    </p>
  )
}
