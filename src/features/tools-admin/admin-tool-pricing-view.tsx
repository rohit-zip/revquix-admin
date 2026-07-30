/**
 * ─── SCREEN 5: PACKAGES & PRICING (§8.5) ─────────────────────────────────────
 *
 * Two halves, and as of **Phase 10 both are live**.
 *
 * **Package and pass editor:** was unavailable until P10 shipped `tools.credit_package` and
 * `tools.user_pass` — those tables are P10's by §1.4 and Appendix A, and creating them here would
 * either have duplicated P10's migration or handed P10 a schema it did not design. P10 has landed, so
 * the capability probe now reports true and the table populates. **The probe is deliberately kept**:
 * a rolling deploy where the application is ahead of the database is the normal case, and an admin
 * screen that 500s during it is worse than one that says "not available yet".
 *
 * Create and edit are here; **delete is deliberately absent**. Deactivation is the only removal,
 * because a deleted SKU orphans every `user_pass.package_code` and every historical
 * `payment_order.context_entity_id` that names it — turning a purchase record into an unexplainable
 * one, and leaving a later refund unable to work out how many credits to revoke.
 *
 * **Per-tool credit-cost overrides:** live since P8, and this is the half §8.5 says matters —
 * "repricing a single tool is the most likely change in month one". It reads
 * `app.tools.credits.overrides.{slug}`, which P7 built precisely so repricing needs no deploy.
 */

"use client";

import React from "react";
import { AlertTriangle, IndianRupee, Pencil, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToolPricing } from "./api/tools-admin.hooks";
import type { AdminPackageRow } from "./api/tools-admin.types";
import { PackageEditorDialog } from "./components/package-editor-dialog";
import {
  ConstraintNote,
  PendingPhasePanel,
  ScreenHeader,
  SectionCard,
  StatCard,
  formatPaise,
} from "./components/tools-admin-shared";

export default function AdminToolPricingView() {
  const pricing = useToolPricing();
  const [filter, setFilter] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminPackageRow | null>(null);

  const rows = React.useMemo(() => {
    const all = pricing.data?.toolPrices ?? [];
    const needle = filter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (row) =>
        row.slug.includes(needle) || row.toolKey.toLowerCase().includes(needle),
    );
  }, [pricing.data, filter]);

  const overriddenCount =
    pricing.data?.toolPrices.filter((r) => r.overridden).length ?? 0;

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="Packages & pricing"
        description="Credit packs and passes, plus the per-tool credit cost every run is charged. Repricing a tool is a configuration change, never a deploy."
      />

      {pricing.isLoading && (
        <div
          className="h-32 animate-pulse rounded-lg border bg-muted/40"
          aria-hidden="true"
        />
      )}

      {pricing.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not load pricing</AlertTitle>
          <AlertDescription>
            This page needs <code>PERM_MANAGE_CREDITS</code>.
          </AlertDescription>
        </Alert>
      )}

      {pricing.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tools priced"
              value={pricing.data.toolPrices.length}
              hint={`${overriddenCount} carrying a configuration override`}
            />
            <StatCard
              label="Reference ₹ per credit"
              value={
                pricing.data.inrPerCreditReference === null
                  ? "—"
                  : `₹${pricing.data.inrPerCreditReference.toFixed(2)}`
              }
              hint="Implied by the Pro pack: 75 credits / ₹249"
            />
            <StatCard
              label="Observed marginal cost"
              value={
                pricing.data.marginalCostPaise === null
                  ? "no data"
                  : formatPaise(pricing.data.marginalCostPaise)
              }
              hint="Worst p95 cost per run over 30 days. Never price a credit below 10× this."
            />
          </div>

          {pricing.data.packageEditorAvailable ? (
            <SectionCard
              title="Credit packages & passes"
              description="Editable without a deploy. Every change is audited with the previous values, because this table holds only current state."
              actions={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setEditorOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  New package
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Pass days</TableHead>
                      <TableHead className="text-right">Daily cap</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">₹/credit</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricing.data.packages.map((pack) => (
                      <TableRow key={pack.packageId}>
                        <TableCell className="font-mono text-xs">
                          {pack.code}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {pack.label}
                          {pack.featured && (
                            <Badge
                              variant="secondary"
                              className="ml-1.5 text-[10px]"
                            >
                              popular
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {pack.credits ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {pack.passDays ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {pack.passDailyRunCap ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatPaise(pack.priceMinor)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                          {pack.pricePerCredit === null
                            ? "—"
                            : `₹${pack.pricePerCredit.toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={pack.active ? "default" : "outline"}
                            className="text-xs"
                          >
                            {pack.active ? "on sale" : "withdrawn"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditing(pack);
                              setEditorOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">Edit {pack.code}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ConstraintNote>
                A pass is not a bundle of credits — it bypasses the debit for
                its window and mints nothing, so its `credits` column is
                deliberately empty. The database refuses a row that is both,
                because that would be double value from one purchase.
                Withdrawing a SKU never changes a pass already sold under it:
                the terms are frozen onto each pass at purchase.
              </ConstraintNote>
            </SectionCard>
          ) : (
            <PendingPhasePanel
              title="Credit packages & passes"
              phase="P10"
              reason={pricing.data.packageEditorUnavailableReason ?? ""}
            />
          )}

          <SectionCard
            title="Per-tool credit cost"
            description="The price a run is actually charged. An override of 0 is meaningful — it makes a paid tool free for a promotional window — and is not treated as unset."
            actions={
              <div className="w-48">
                <Label htmlFor="pricing-filter" className="sr-only">
                  Filter tools
                </Label>
                <Input
                  id="pricing-filter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter by slug…"
                  className="h-8 text-xs"
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Layers</TableHead>
                    <TableHead className="text-right">Default</TableHead>
                    <TableHead className="text-right">Effective</TableHead>
                    <TableHead className="text-right">≈ ₹</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.toolKey}>
                      <TableCell className="text-xs">
                        <span className="font-mono">{row.slug}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {row.tier.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.layer}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {row.defaultCredits}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">
                        {row.effectiveCredits}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {row.approxInr === null
                          ? "—"
                          : `₹${row.approxInr.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {row.overridden && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="cursor-default text-xs"
                              >
                                overridden
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">
                                Set through{" "}
                                <code>
                                  app.tools.credits.overrides.{row.slug}
                                </code>
                                . Changing it needs a configuration reload, not
                                a deploy.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {!row.launched && (
                          <Badge variant="outline" className="text-xs">
                            not launched
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <ConstraintNote>
            <IndianRupee className="mr-1 inline h-3 w-3" aria-hidden="true" />
            Prices are read from configuration, so this table is a view rather
            than an editor: changing an override is a config change on the
            server. That is deliberate — it keeps one source of truth for the
            number the run pipeline actually charges. The ≈₹ column exists so a
            repricing can be sanity-checked against §10.2&apos;s rule that a
            credit is never priced below 10× its marginal cost.
          </ConstraintNote>
        </>
      )}

      <PackageEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        pack={editing}
      />
    </div>
  );
}
