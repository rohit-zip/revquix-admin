"use client"

/**
 * ManualRecipientAddRow — the "email + name + Add" row behind the compose wizard's Manual Entry
 * audience tab (Phase 3, requirement 3).
 *
 * Deliberately not the same component as the existing chips-based <LeadMailRecipientInput>
 * (lead-mail-recipient-input.tsx): that one is a compact autocomplete input still used by the
 * legacy single-page compose form. This one feeds the shared <RecipientReviewTable> instead of a
 * chip list, because a table row can be edited, badged, and deleted individually — a chip cannot.
 *
 * Enter in the email field adds the row and refocuses the email input, so an admin can paste or
 * type a long hand-typed list without reaching for the mouse between rows.
 */

import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { newLocalRowId, RECIPIENT_SOURCE, type RecipientRow } from "./recipient-row"

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ManualRecipientAddRowProps {
  existingRows: RecipientRow[]
  onAdd: (row: RecipientRow) => void
  disabled?: boolean
}

export function ManualRecipientAddRow({ existingRows, onAdd, disabled }: ManualRecipientAddRowProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      return
    }
    if (!SIMPLE_EMAIL.test(trimmedEmail)) {
      setError("Enter a valid email address")
      return
    }
    const normalized = trimmedEmail.toLowerCase()
    if (existingRows.some((row) => row.email.toLowerCase() === normalized)) {
      setError("This email is already in the list")
      return
    }

    onAdd({
      id: newLocalRowId(),
      email: normalized,
      name: name.trim() || null,
      source: RECIPIENT_SOURCE.MANUAL,
    })
    setEmail("")
    setName("")
    setError(null)
    emailInputRef.current?.focus()
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1 space-y-1">
          <Input
            ref={emailInputRef}
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAdd()
              }
            }}
            disabled={disabled}
            className="h-9"
          />
        </div>
        <div className="min-w-[160px] flex-1 space-y-1">
          <Input
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAdd()
              }
            }}
            disabled={disabled}
            className="h-9"
          />
        </div>
        <Button type="button" onClick={handleAdd} disabled={disabled || !email.trim()} className="h-9 gap-1.5">
          <Plus className="size-4" /> Add
        </Button>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Press Enter to add and keep typing the next one. A recipient with no name will be skipped if your content
        uses {"{{name}}"}.
      </p>
    </div>
  )
}
