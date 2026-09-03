/**
 * ─── BRANDED QR CODE ─────────────────────────────────────────────────────────
 *
 * A QR code drawn as SVG in the browser: circular data dots, rounded finder "eyes" in the brand
 * blue, and the Revquix mark knocked out of the centre.
 *
 * ─── ⚠ Twin of `revquix-web/src/components/dashboard/ui/qr-code.tsx` ─────────
 *
 * The two repos deploy independently and share no package, so this is a deliberate copy rather than
 * an import. Keep them in step — the same enrolment happens on both surfaces and a member who sees
 * one on the console and the other in the app is looking at two products. The web copy has the
 * fuller commentary; the constraints below are the ones that decide whether it scans at all, so
 * they are restated here rather than left in the other repo.
 *
 * ─── The four rules this respects ────────────────────────────────────────────
 *
 * 1. **Error correction H.** ~30% of the symbol can be destroyed and still decode. Anything the
 *    logo covers comes out of that budget, so a logo without level H is a code that scans on the
 *    developer's phone and fails on somebody else's.
 *
 * 2. **The logo stays small and central.** {@link LOGO_RATIO} is 22% of the *side*, which is 4.8%
 *    of the AREA — a fraction of what H can absorb. The oft-quoted "up to 30%" is the ceiling with
 *    no margin left for a smudged screen or a bad angle.
 *
 * 3. **Never touch the three finder patterns.** They are how a scanner locates and orients the
 *    symbol before it decodes anything, so error correction does not cover them at all. Restyling
 *    is fine — they only have to keep the 1:1:3:1:1 dark/light run ratio, which a rounded square of
 *    the same proportions does.
 *
 * 4. **Dark on light, with a four-module quiet zone.** Both are absolute. Readers threshold on
 *    luminance, so an inverted code fails on a large share of them — which is why this component
 *    always paints its own white ground rather than inheriting the surface it sits on.
 *
 * The blue eyes are the one liberty taken. `#006FEE` sits at ~17% relative luminance against white,
 * far past the 40% contrast difference readers need, so it buys brand recognition for nothing.
 */

"use client"

import { useMemo } from "react"
import QRCode from "qrcode"

import { cn } from "@/lib/utils"

/** Mandatory blank margin, in modules. Four is the spec minimum; less and readers miss the symbol. */
const QUIET_ZONE = 4

/** Logo side as a fraction of the symbol side. 0.22 ⇒ 4.8% of the area — see rule 2 above. */
const LOGO_RATIO = 0.22

/** Dot radius in modules. 0.5 is a circle inscribed in its cell, which is the classic dot look. */
const DOT_RADIUS = 0.5

const FINDER_SIZE = 7

interface QrCodeProps {
  /** What the code encodes. An empty string renders nothing rather than throwing. */
  value: string
  /** Rendered side in px. The SVG is vector, so this is presentation only. */
  size?: number
  /** Colour of the data dots. Must stay dark — see rule 4. */
  dotColor?: string
  /** Colour of the three finder eyes. */
  finderColor?: string
  /** Set false to drop the centre mark. */
  withLogo?: boolean
  className?: string
  /** Announced to screen readers. The code itself is decorative to them. */
  label?: string
}

function round(value: number) {
  return Math.round(value * 1000) / 1000
}

/** One circle, written as a two-arc subpath so the whole dot field is a single `<path>`. */
function dot(cx: number, cy: number, r: number) {
  const x = round(cx - r)
  const y = round(cy)
  const d = round(r * 2)
  return `M${x} ${y}a${round(r)} ${round(r)} 0 1 0 ${d} 0a${round(r)} ${round(r)} 0 1 0 ${-d} 0`
}

export function QrCode({
  value,
  size = 224,
  dotColor = "#0F172A",
  finderColor = "#006FEE",
  withLogo = true,
  className,
  label = "QR code",
}: QrCodeProps) {
  const model = useMemo(() => {
    if (!value) return null

    let matrix
    try {
      matrix = QRCode.create(value, { errorCorrectionLevel: "H" }).modules
    } catch {
      // A value too long for even a version-40 symbol. Callers always have a text fallback next to
      // the code (the setup key), so a missing image is a degraded screen, not a broken one.
      return null
    }

    const count = matrix.size
    const viewBox = count + QUIET_ZONE * 2

    // Odd, so it centres on the middle module — every QR side length is odd, so an odd cut-out
    // leaves an equal whole number of modules on both sides and the plate lands on the grid.
    let logo = Math.round(count * LOGO_RATIO)
    if (logo % 2 === 0) logo -= 1
    const logoStart = (count - logo) / 2
    const logoEnd = logoStart + logo

    const finders = [
      { row: 0, col: 0 },
      { row: 0, col: count - FINDER_SIZE },
      { row: count - FINDER_SIZE, col: 0 },
    ]

    const inFinder = (row: number, col: number) =>
      finders.some(
        (f) => row >= f.row && row < f.row + FINDER_SIZE && col >= f.col && col < f.col + FINDER_SIZE,
      )

    const inLogo = (row: number, col: number) =>
      withLogo && row >= logoStart && row < logoEnd && col >= logoStart && col < logoEnd

    let path = ""
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (matrix.data[row * count + col] !== 1) continue
        if (inFinder(row, col) || inLogo(row, col)) continue
        path += dot(col + 0.5 + QUIET_ZONE, row + 0.5 + QUIET_ZONE, DOT_RADIUS)
      }
    }

    return {
      viewBox,
      path,
      finders: finders.map((f) => ({ x: f.col + QUIET_ZONE, y: f.row + QUIET_ZONE })),
      logo: { x: logoStart + QUIET_ZONE, y: logoStart + QUIET_ZONE, side: logo },
    }
  }, [value, withLogo])

  if (!model) return null

  const { viewBox, path, finders, logo } = model
  // 32 is the Revquix mark's own viewBox. 0.66 leaves a white ring around it, which is what stops
  // the mark reading as part of the data field.
  const markSide = logo.side * 0.66
  const markScale = markSide / 32
  const markOffset = logo.x + (logo.side - markSide) / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      shapeRendering="geometricPrecision"
      className={cn("block", className)}
    >
      {/* The white ground is the component's, not the surface's — an inverted QR does not scan. */}
      <rect width={viewBox} height={viewBox} fill="#FFFFFF" rx={1.5} />

      <path d={path} fill={dotColor} />

      {finders.map((finder) => (
        <g key={`${finder.x}-${finder.y}`}>
          {/* Stroked at one module and inset by half of it, so the ring occupies exactly the outer
              module row of the 7×7 pattern — the 1:1:3:1:1 run ratio a reader looks for. */}
          <rect
            x={finder.x + 0.5}
            y={finder.y + 0.5}
            width={FINDER_SIZE - 1}
            height={FINDER_SIZE - 1}
            rx={2}
            fill="none"
            stroke={finderColor}
            strokeWidth={1}
          />
          <rect x={finder.x + 2} y={finder.y + 2} width={3} height={3} rx={1} fill={finderColor} />
        </g>
      ))}

      {withLogo && (
        <g>
          <rect
            x={logo.x}
            y={logo.y}
            width={logo.side}
            height={logo.side}
            rx={logo.side * 0.22}
            fill="#FFFFFF"
          />
          <g
            transform={`translate(${round(markOffset)} ${round(markOffset)}) scale(${round(markScale)})`}
          >
            <circle cx="16" cy="16" r="16" fill={finderColor} />
            <path
              d="M10.5 24.638l3.467-1.812V10.745l4.952 2.778-3.714 1.933v3.987L23.5 25v-3.745l-5.076-3.503 4.209-2.175v-3.866L13.967 7 10.5 8.812z"
              fill="#FFFFFF"
            />
          </g>
        </g>
      )}
    </svg>
  )
}

export default QrCode
