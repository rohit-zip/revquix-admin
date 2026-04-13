"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailChipsInputProps {
  value: string[]
  onChange: (emails: string[]) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: string
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export const EmailChipsInput = ({
  value,
  onChange,
  placeholder = "email@company.com",
  disabled = false,
  error,
  helperText,
}: EmailChipsInputProps) => {
  const [inputValue, setInputValue] = useState("")
  const [inputError, setInputError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddEmail = (email: string) => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) return

    // Check if email already exists
    if (value.includes(trimmedEmail)) {
      setInputError("This email is already added")
      return
    }

    // Validate email format
    if (!isValidEmail(trimmedEmail)) {
      setInputError("Please enter a valid email address")
      return
    }

    // Add the email
    onChange([...value, trimmedEmail])
    setInputValue("")
    setInputError("")
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setInputError("")

    // Handle comma as separator
    if (newValue.endsWith(",")) {
      const email = newValue.slice(0, -1)
      handleAddEmail(email)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last email when backspace is pressed and input is empty
      onChange(value.slice(0, -1))
    } else if (e.key === ",") {
      e.preventDefault()
      handleAddEmail(inputValue)
    }
  }

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove))
  }

  const inputBase = cn(
    "rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60",
    "outline-none ring-0 transition-all duration-150",
    "focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20",
    "dark:bg-white/[0.03] dark:focus:border-primary-500",
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-xl border p-3",
          "border-border bg-muted/30 transition-all duration-150",
          error ? "border-rose-400" : "focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20",
          disabled && "cursor-not-allowed opacity-50",
          "dark:bg-white/[0.03]",
        )}
      >
        {/* Email Chips */}
        {value.map((email) => (
          <div
            key={email}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
              "bg-primary-500/15 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300",
            )}
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              onClick={() => removeEmail(email)}
              disabled={disabled}
              className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-primary-500/20 disabled:cursor-not-allowed"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[150px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60",
            "outline-none border-none ring-0",
            "disabled:cursor-not-allowed",
          )}
        />
      </div>

      {/* Input Error */}
      {inputError && <p className="text-xs text-rose-500">{inputError}</p>}

      {/* Helper Text */}
      {!inputError && helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}

      {/* Error Message */}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

