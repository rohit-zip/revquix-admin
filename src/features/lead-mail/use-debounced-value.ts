"use client"

import { useEffect, useState } from "react"

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Extracted from `lead-mail-recipient-input.tsx`, which had defined it privately, once the campaign
 * history search needed the same behaviour. Both call sites debounce a text input that drives a
 * request per keystroke otherwise — the recipient autocomplete and the campaign filter.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(handle)
  }, [value, delayMs])

  return debounced
}
