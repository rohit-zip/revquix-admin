"use client"

/**
 * LeadMailRecipientInput — manual recipient entry for the Admin Lead Mailer.
 *
 * A variant of the shared EmailChipsInput (kept separate, not modified in place,
 * since that component is used elsewhere and this one adds a name field per chip
 * plus a live autocomplete dropdown against registered users):
 *
 *  - Typing 2+ characters triggers GET /admin/lead-mail/search-recipients (debounced).
 *  - Selecting a suggestion adds a {email, name} chip.
 *  - Typing a raw email with no match and pressing Enter/comma still adds a
 *    {email, name: null} chip — so admins can target leads who aren't registered.
 */

import { useEffect, useRef, useState } from "react"
import { Loader2, Mail, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLeadMailRecipientSearch } from "@/features/lead-mail/api/lead-mail.hooks"
import type { LeadMailRecipientInput as RecipientInput } from "@/features/lead-mail/api/lead-mail.types"
import { useDebouncedValue } from "@/features/lead-mail/use-debounced-value"

interface LeadMailRecipientInputProps {
  value: RecipientInput[]
  onChange: (recipients: RecipientInput[]) => void
  disabled?: boolean
  error?: string
  helperText?: string
}

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())


export function LeadMailRecipientInput({
  value,
  onChange,
  disabled = false,
  error,
  helperText,
}: LeadMailRecipientInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [inputError, setInputError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebouncedValue(inputValue, 250)
  const { data: suggestions, isFetching } = useLeadMailRecipientSearch(debouncedQuery)

  const existingEmails = new Set(value.map((r) => r.email.toLowerCase()))
  const filteredSuggestions = (suggestions ?? []).filter(
    (s) => !existingEmails.has(s.email.toLowerCase()),
  )

  // Close the dropdown when clicking outside the component.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addRecipient = (recipient: RecipientInput) => {
    const normalizedEmail = recipient.email.trim().toLowerCase()
    if (existingEmails.has(normalizedEmail)) {
      setInputError("This email is already added")
      return
    }
    onChange([...value, { email: normalizedEmail, name: recipient.name ?? null }])
    setInputValue("")
    setInputError("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const addRawEmail = (raw: string) => {
    const trimmed = raw.trim().replace(/,$/, "")
    if (!trimmed) return
    if (!isValidEmail(trimmed)) {
      setInputError("Please enter a valid email address")
      return
    }
    addRecipient({ email: trimmed, name: null })
  }

  const removeRecipient = (email: string) => {
    onChange(value.filter((r) => r.email !== email))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputError("")
    setIsOpen(true)
    if (newValue.endsWith(",")) {
      addRawEmail(newValue)
      return
    }
    setInputValue(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (filteredSuggestions.length > 0) {
        addRecipient(filteredSuggestions[0])
      } else {
        addRawEmail(inputValue)
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const showDropdown =
    isOpen && inputValue.trim().length >= 2 && (isFetching || filteredSuggestions.length > 0)

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-xl border p-3",
          "border-border bg-muted/30 transition-all duration-150",
          error ? "border-rose-400" : "focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20",
          disabled && "cursor-not-allowed opacity-50",
          "dark:bg-white/[0.03]",
        )}
      >
        {value.map((recipient) => (
          <div
            key={recipient.email}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
              "bg-primary-500/15 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300",
            )}
          >
            <span className="truncate">
              {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
            </span>
            <button
              type="button"
              onClick={() => removeRecipient(recipient.email)}
              disabled={disabled}
              className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-primary-500/20 disabled:cursor-not-allowed"
              aria-label={`Remove ${recipient.email}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? "Search by name/email, or type an email…" : ""}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[200px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60",
            "outline-none border-none ring-0",
            "disabled:cursor-not-allowed",
          )}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {isFetching && filteredSuggestions.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {filteredSuggestions.map((suggestion) => (
                <li key={suggestion.userId}>
                  <button
                    type="button"
                    onClick={() => addRecipient({ email: suggestion.email, name: suggestion.name })}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={suggestion.avatarUrl ?? undefined} alt={suggestion.name ?? suggestion.email} />
                      <AvatarFallback className="text-[10px]">
                        <Mail className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{suggestion.name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{suggestion.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {inputError && <p className="text-xs text-rose-500">{inputError}</p>}
      {!inputError && helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}
