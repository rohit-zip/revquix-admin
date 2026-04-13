"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Lightweight IntersectionObserver hook — replaces Framer Motion's
 * `whileInView` with zero JS animation overhead.
 *
 * Returns a `ref` to attach to the element and an `inView` boolean that
 * flips to `true` (once) when the element enters the viewport.
 * Pair with the `.sv-fade-up` / `.sv-fade-up.in-view` CSS classes in
 * globals.css for fully GPU-composited scroll-triggered animations.
 *
 * @param margin  rootMargin passed to IntersectionObserver (negative values
 *                mean the element must be this far *inside* the viewport
 *                before the animation fires — prevents premature triggers).
 */
export function useInView(margin = "-60px") {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          // Disconnect immediately — we only want to trigger once (like `once: true`)
          observer.disconnect()
        }
      },
      { rootMargin: margin, threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [margin])

  return { ref, inView }
}

