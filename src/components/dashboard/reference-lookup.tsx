"use client"

/**
 * ─── REFERENCE LOOKUP ─────────────────────────────────────────────────────────
 *
 * Paste any Professional Mentor reference, land on its page.
 *
 * <h3>Why this is in the topbar rather than on a page</h3>
 * The most common input to an admin session is an id somebody else wrote down — `BKG00000007` out of
 * a support ticket, `DSP00000004` out of an alert email. Every one of those now has a table and a
 * detail page, but reaching it still meant knowing which of six tables it lived in and navigating
 * there before you could search. That is a step in every single support interaction. A lookup that
 * lives on one page would just be a seventh place to navigate to first.
 *
 * <h3>The server resolves it, not the client</h3>
 * A client-side prefix map would be a second copy of the id scheme, and it would happily route to a
 * detail page for a reference that does not exist — so the operator would learn about their typo one
 * navigation later, on a 404. The endpoint looks the row up before returning a path.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { lookupReference } from "@/features/mentorship-v2/api/ops.api"

export function ReferenceLookup() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const lookup = useMutation({
    mutationFn: lookupReference,
    onSuccess: (result) => {
      if (result.path) {
        setValue("")
        setError(null)
        router.push(result.path)
        return
      }
      setError(result.message ?? "Nothing matched that reference.")
    },
    onError: () => setError("Lookup failed. Try again."),
  })

  return (
    <div className="relative hidden sm:block">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          if (error) setError(null)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) {
            lookup.mutate(value.trim())
          }
        }}
        placeholder="Find BKG… ORD… DSP…"
        aria-label="Look up a reference"
        className="h-8 w-52 pl-8 text-xs lg:w-64"
      />
      {lookup.isPending ? (
        <Loader2
          className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
      {error ? (
        <p
          role="status"
          className="absolute left-0 top-full z-40 mt-1 w-full rounded-md border bg-popover px-2 py-1.5 text-[11px] text-destructive shadow-md"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
