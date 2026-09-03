/**
 * ─── THE SETUP KEY ───────────────────────────────────────────────────────────
 *
 * The typed-by-hand half of enrolment: the base32 secret, the fields an app may ask for alongside
 * it, and a copy button that actually works.
 *
 * ─── ⚠ Twin of `revquix-web/src/features/dashboard/user/components/mfa/mfa-setup-key.tsx` ─────
 * Same behaviour, this console's plainer type scale. Keep them in step.
 *
 * ─── Why this is a component and not two lines of markup ─────────────────────
 *
 * It replaced a bare `<code>` block with no copy control, which quietly made manual entry the worst
 * path on the screen: thirty-two ambiguous characters — O against 0, I against 1 — retyped into a
 * phone keyboard, with no way to check them, by somebody who is on this path precisely because
 * scanning already failed them. One transcription slip surfaces a step later as a rejected code with
 * no clue which of the two things went wrong.
 *
 *   • **Grouped in fours to read, ungrouped to copy.** Spaces make the string checkable by eye;
 *     the clipboard gets the raw secret, because some apps take the pasted value literally.
 *   • **The copy has a fallback.** `navigator.clipboard` is undefined outside a secure context and
 *     rejects when the document is not focused, so a failure selects the text instead and says so.
 *   • **The extra fields are folded away.** Most apps read type, digits and period out of the QR; a
 *     handful ask on a manual-entry form, and there is nowhere else to find them.
 */

"use client"

import { useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"

interface MfaSetupKeyProps {
  /** The base32 secret, exactly as the server issued it. */
  secret: string
  /** The `otpauth://` URI, if the caller has it — the extra fields are read out of it. */
  otpauthUri?: string
  className?: string
}

/** `ABCD EFGH …` — four-character groups are the span most people can hold in one glance. */
function grouped(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim()
}

/**
 * Pulls the fields a manual-entry form might ask for out of the URI.
 *
 * Defaults are RFC 6238's, and they are what the server issues; reading them from the URI rather
 * than hard-coding them means this display cannot drift from what was actually encoded.
 */
function readDetails(uri: string | undefined) {
  if (!uri) return null
  try {
    const parsed = new URL(uri)
    const params = parsed.searchParams
    // The label is `issuer:account`, percent-encoded, after `otpauth://totp/`.
    const label = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))
    const account = label.includes(":") ? label.slice(label.indexOf(":") + 1) : label
    return {
      account,
      issuer: params.get("issuer") ?? "Revquix",
      type: "Time-based (TOTP)",
      algorithm: params.get("algorithm") ?? "SHA1",
      digits: params.get("digits") ?? "6",
      period: `${params.get("period") ?? "30"} seconds`,
    }
  } catch {
    // A URI we cannot parse is not worth a broken panel — the secret above it is unaffected.
    return null
  }
}

export default function MfaSetupKey({ secret, otpauthUri, className }: MfaSetupKeyProps) {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const keyRef = useRef<HTMLElement>(null)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const details = useMemo(() => readDetails(otpauthUri), [otpauthUri])

  async function copy() {
    try {
      // The raw secret, not the spaced one — see the header.
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      showSuccessToast("Setup key copied", { description: "Paste it into your authenticator app." })
      if (resetRef.current) clearTimeout(resetRef.current)
      resetRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Selecting it leaves one keystroke to the same result, which beats a button that appears to
      // do nothing.
      const node = keyRef.current
      if (node) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      // This console's showErrorToast takes an Error, not a string — a plain Error's message
      // becomes the toast title.
      showErrorToast(new Error("Couldn't reach your clipboard"), {
        description: "The key is selected — copy it with ⌘C or Ctrl+C.",
      })
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium">Setup key</p>
        <p className="text-[11px] text-muted-foreground">Use this if the scan won&rsquo;t work</p>
      </div>

      <div className="flex items-stretch gap-1.5 rounded-lg border bg-muted/40 p-1.5 pl-3 focus-within:ring-2 focus-within:ring-ring/40">
        <code
          ref={keyRef}
          // `select-all` makes one click take the whole key — the fallback to the fallback.
          // `break-words`, not `break-all`: the grouping puts a break opportunity every four
          // characters, so it wraps between groups instead of mid-group.
          className="min-w-0 flex-1 self-center font-mono text-xs break-words tracking-[0.08em] select-all"
        >
          {grouped(secret)}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          aria-label={copied ? "Setup key copied" : "Copy setup key"}
          className="h-8 shrink-0 gap-1.5 self-center bg-background"
        >
          {copied ? (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-4" />
          )}
          {/* Labelled where there is room — a bare icon is the one thing on this path somebody must
              not have to guess at. */}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>

      {details && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
            // Padded and rounded so the focus ring frames the control instead of shrink-wrapping the
            // text into a stray blue box; the negative margin keeps it optically flush left.
            className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", showDetails && "rotate-180")} />
            Details your app might ask for
          </button>

          {showDetails && (
            /* Divided rows rather than a dense two-column grid: this is a spec sheet somebody reads
               one line at a time while copying it into a form, not a table they scan. */
            <dl className="mt-2 divide-y rounded-lg border bg-background text-[11px]">
              {[
                ["Account", details.account],
                ["Issuer", details.issuer],
                ["Type", details.type],
                ["Algorithm", details.algorithm],
                ["Digits", details.digits],
                ["Refreshes every", details.period],
              ].map(([term, value]) => (
                <div key={term} className="flex items-baseline justify-between gap-4 px-3 py-1.5">
                  <dt className="shrink-0 text-muted-foreground">{term}</dt>
                  <dd className="min-w-0 truncate font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  )
}
