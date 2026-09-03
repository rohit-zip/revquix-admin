"use client"

/**
 * ─── DOCS HEALTH ─────────────────────────────────────────────────────────────
 *
 * `docs/REVQUIX_DOCS_MASTER_PLAN.md` §9 — the console's whole role in the docs plan.
 *
 * ── ⚠ READ-ONLY, AND THAT IS THE POINT ─────────────────────────────────────
 *
 * Nothing here edits anything. Docs authoring lives in revquix-web at `/dashboard/docs`, which is
 * the convention Editorial and the Coding Problems review queue already follow: authoring in the
 * app, oversight in the console. A guide is not editable from anywhere at all — it is MDX in a
 * repository and changes through a PR (§7.1).
 *
 * ── The three signals, and why they are different questions ────────────────
 *
 *   Ratios      — which guides people are bouncing off. We wrote it BADLY.
 *   Comments    — what they came looking for. We have not written it AT ALL.
 *   Zero-result — what they ASKED and we had nothing for. §9.1's writing backlog.
 *
 * The last two are the valuable ones and the easy ones to overlook, which is why neither is a
 * drill-down off the table.
 *
 * ⚠ Zero-result rows have been written to `analytics.user_search_log` since P1 and read by nobody
 * until now. That is the worse half of the failure: not a missing feature, but a signal that was
 * being collected, was assumed to be informing the backlog, and reached no screen. §9.1 depends on
 * this list, and so does P5b's first entry condition.
 *
 * ⚠ Staleness is deliberately ABSENT. `lastVerified` and `relatedPaths` live in the web repository
 * and are enforced by its CI (§7.4) — the backend cannot see the MDX, so surfacing a second opinion
 * here would create two answers to one question.
 *
 * ⚠ Comment text is untrusted free text from an anonymous public endpoint. Rendered as text,
 * always — never as markup.
 */

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/axios"

interface Ratio {
  doc_slug: string
  votes: number
  helpful: number
  unhelpful: number
  helpful_pct: number
}

interface Comment {
  doc_slug: string
  helpful: boolean
  comment: string
  created_at: string
}

interface ZeroResultQuery {
  query: string
  asked: number
  last_asked: string
}

interface Volume {
  searches: number
  misses: number
}

interface HealthPayload {
  windowDays: number
  ratios: Ratio[]
  recentComments: Comment[]
  zeroResultQueries: ZeroResultQuery[]
  docsVolume: Volume
  paletteVolume: Volume
}

async function fetchHealth(): Promise<HealthPayload> {
  const { data } = await apiClient.get<HealthPayload>("/admin/docs/health")
  return data
}

export function DocsHealthView() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["docs-health"],
    queryFn: fetchHealth,
    staleTime: 60_000,
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (isError) return <p className="text-sm text-muted-foreground">Could not load docs health.</p>

  const ratios = data?.ratios ?? []
  const comments = data?.recentComments ?? []
  const misses = data?.zeroResultQueries ?? []
  const windowDays = data?.windowDays ?? 30
  const docsVolume = data?.docsVolume
  const paletteVolume = data?.paletteVolume

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Docs health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Which guides readers bounce off, what they came looking for, and what they asked that we
          have no answer for. Last {windowDays} days. Read-only — notices, redirects and the search
          corpus are managed in the app.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Questions with no answer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Searches on <code>/docs/search</code> that returned nothing. This is the writing backlog:
          each row is somebody who came looking before they gave up and filed a ticket.
        </p>

        {/*
          ⚠ The denominator travels with the count on purpose. "8 misses" is a crisis on a corpus
          nobody uses and a rounding error on one answering a thousand questions a day, and the bare
          number reads as the first while usually meaning the second.
        */}
        {docsVolume ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{docsVolume.misses}</span>{" "}
            of{" "}
            <span className="font-medium text-foreground tabular-nums">{docsVolume.searches}</span>{" "}
            searches came back empty
            {paletteVolume && paletteVolume.searches > 0 ? (
              <>
                {" "}
                · typeahead is counted separately (
                <span className="tabular-nums">{paletteVolume.misses}</span>/
                <span className="tabular-nums">{paletteVolume.searches}</span>), where a miss usually
                means three letters rather than a gap
              </>
            ) : null}
          </p>
        ) : null}

        {misses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing came back empty in the window. On a young corpus that means low traffic more
            often than it means good coverage.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Asked</th>
                  <th className="px-3 py-2 font-medium">Times</th>
                  <th className="px-3 py-2 font-medium">Last</th>
                </tr>
              </thead>
              <tbody>
                {misses.map((m) => (
                  <tr key={m.query} className="border-t">
                    {/* ⚠ Text, never markup. Anonymous public input, same as the comments below. */}
                    <td className="px-3 py-2">{m.query}</td>
                    <td className="px-3 py-2 tabular-nums">{m.asked}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(m.last_asked).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Worst-rated guides</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordered by ratio, not by traffic. A popular guide with a good ratio is not news.
        </p>

        {ratios.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No votes yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Guide</th>
                  <th className="px-3 py-2 font-medium">Helpful</th>
                  <th className="px-3 py-2 font-medium">Votes</th>
                </tr>
              </thead>
              <tbody>
                {ratios.map((r) => (
                  <tr key={r.doc_slug} className="border-t">
                    <td className="px-3 py-2">{r.doc_slug}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.helpful_pct}% <span className="text-muted-foreground">({r.helpful}/{r.votes})</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">What readers said</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The half that says what is missing rather than what is wrong.
        </p>

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {comments.map((c, i) => (
              <li key={`${c.doc_slug}-${i}`} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  {c.doc_slug} · {c.helpful ? "helpful" : "not helpful"}
                </p>
                {/* ⚠ Text, never markup. Anonymous public input. */}
                <p className="mt-1">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
