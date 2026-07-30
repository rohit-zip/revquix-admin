/**
 * ─── SCREEN 8: CONTENT LIBRARY (§8.8) ────────────────────────────────────────
 *
 * Scaffolding, honestly labelled. §8.8 assigns the *screen* to Phase 8 and the *tables* to the tool
 * phases that own them: the interview question bank to P13, DSA problems to P18, aptitude sets to P22,
 * daily challenges to P18. There is nothing to CRUD yet, and inventing the tables here would mean P13
 * either altering a schema it did not design or shipping a second one.
 *
 * So each collection is probed server-side and reported with its owning phase. Each phase lights up its
 * own row by shipping its table — no change to this file.
 */

"use client"

import React from "react"
import { AlertTriangle, CheckCircle2, Clock, FolderTree } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useContentLibraryStatus } from "./api/tools-admin.hooks"
import {
  ConstraintNote,
  ScreenHeader,
  SectionCard,
  formatNumber,
} from "./components/tools-admin-shared"

export default function AdminToolContentView() {
  const status = useContentLibraryStatus()

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Content library"
        description="The editorial collections behind the interview question bank, DSA problems, aptitude sets and daily challenges. Each is owned by the tool phase that ships it."
      />

      {status.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not load the library</AlertTitle>
          <AlertDescription>
            This page needs <code>PERM_MANAGE_TOOL_RUBRIC</code>.
          </AlertDescription>
        </Alert>
      )}

      {status.isLoading && (
        <div className="h-40 animate-pulse rounded-lg border bg-muted/40" aria-hidden="true" />
      )}

      {status.data && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {status.data.collections.map((collection) => (
              <SectionCard
                key={collection.collection}
                title={collection.label}
                description={collection.toolReference}
                actions={
                  collection.available ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                      available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                      {collection.ownedByPhase}
                    </Badge>
                  )
                }
              >
                {collection.available ? (
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Rows</dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {formatNumber(collection.rowCount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Published</dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {collection.publishedCount === null
                          ? "—"
                          : formatNumber(collection.publishedCount)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Table</dt>
                      <dd className="font-mono text-[11px]">tools.{collection.collection}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {collection.unavailableReason}
                  </p>
                )}
              </SectionCard>
            ))}
          </div>

          <ConstraintNote tone="warning">
            <FolderTree className="mr-1 inline h-3 w-3" aria-hidden="true" />
            {status.data.contentVersusRunNote}
          </ConstraintNote>
        </>
      )}
    </div>
  )
}
