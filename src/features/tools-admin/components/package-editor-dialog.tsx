/**
 * ─── §8.5 PACKAGE EDITOR — lit up by Phase 10 ────────────────────────────────
 *
 * P8 built Screen 5 behind an `information_schema` probe naming P10 as the owner of
 * `tools.credit_package`. This is the write half: create, edit, and activate/deactivate a SKU.
 *
 * ─── Four rules the form enforces, and why each is here rather than only server-side ──
 *
 * 1. **`code` and `kind` are set once and then read-only.** A code is referenced by every historical
 *    purchase and by every pass sold under it, and a pack that became a pass would silently
 *    reinterpret every past purchase. Disabling the inputs on edit is clearer than accepting the
 *    change and having the server ignore it.
 *
 * 2. **A pack's and a pass's fields are mutually exclusive.** The database refuses the combination
 *    outright (`ck_credit_package_shape`) because a row that both granted credits and bypassed
 *    debits is double value from one purchase. The form simply does not render the other kind's
 *    fields.
 *
 * 3. **The reason is mandatory.** Same `ReasonField` every other write in this console uses. A price
 *    edit changes what every subsequent buyer is charged, needs no second approval, and this table
 *    holds only current state — so the audit row is the only place the previous price will ever
 *    exist.
 *
 * 4. **There is no delete.** Deactivation only, and the panel says so. A deleted SKU orphans every
 *    purchase record that names it.
 *
 * ─── Motion ──────────────────────────────────────────────────────────────────
 *
 * No `framer-motion`. The dialog is the existing Radix primitive with the repo's `tw-animate-css`
 * keyframes, and `globals.css` already carries a global `prefers-reduced-motion` reset.
 */

"use client";

import React from "react";
import { AlertTriangle, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useCreateCreditPackage,
  useUpdateCreditPackage,
} from "../api/tools-admin.hooks";
import type {
  AdminPackageRow,
  AdminPackageUpsertRequest,
} from "../api/tools-admin.types";
import {
  ReasonField,
  isReasonValid,
  type ReasonState,
} from "./tools-admin-shared";

interface PackageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` opens the create form. */
  pack: AdminPackageRow | null;
}

type Draft = {
  code: string;
  kind: "PACK" | "PASS";
  label: string;
  description: string;
  credits: string;
  passDays: string;
  passDailyRunCap: string;
  priceRupees: string;
  mrpRupees: string;
  currency: string;
  active: boolean;
  featured: boolean;
  displayOrder: string;
};

/**
 * Rupees in the form, paise on the wire.
 *
 * An operator types 249, not 24900. Making them type minor units is how a two-order-of-magnitude
 * pricing mistake happens, and it is not caught by any approval cap.
 */
function toDraft(pack: AdminPackageRow | null): Draft {
  if (!pack) {
    return {
      code: "",
      kind: "PACK",
      label: "",
      description: "",
      credits: "",
      passDays: "",
      passDailyRunCap: "30",
      priceRupees: "",
      mrpRupees: "",
      currency: "INR",
      active: true,
      featured: false,
      displayOrder: "0",
    };
  }
  return {
    code: pack.code,
    kind: pack.kind,
    label: pack.label ?? "",
    description: pack.description ?? "",
    credits: pack.credits === null ? "" : String(pack.credits),
    passDays: pack.passDays === null ? "" : String(pack.passDays),
    passDailyRunCap:
      pack.passDailyRunCap === null ? "" : String(pack.passDailyRunCap),
    priceRupees: String(pack.priceMinor / 100),
    mrpRupees: pack.mrpMinor === null ? "" : String(pack.mrpMinor / 100),
    currency: pack.currency ?? "INR",
    active: pack.active,
    featured: pack.featured,
    displayOrder: String(pack.displayOrder),
  };
}

function rupeesToPaise(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

function toIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function PackageEditorDialog({
  open,
  onOpenChange,
  pack,
}: PackageEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/*
          The form is a child keyed on the row, and that key is the whole state-reset mechanism.

          The obvious alternatives are both worse. A `useEffect` that re-seeds on `pack` change is a
          `setState` in an effect purely to copy props — it costs an extra render and trips
          `react-hooks/set-state-in-effect`, which P1 §1.14 recorded as a rule this repo does not add
          new violations to. A `useRef` comparison in the render body trips `react-hooks/refs` for a
          real reason: it makes the reset depend on render timing.

          `key` is the idiomatic answer: React discards the old instance and the new one's
          `useState` initialisers read the new row. Rendering only while `open` means closing the
          dialog also clears a half-typed reason, which is the right default for an audited write —
          reopening should not silently reuse yesterday's justification.
        */}
        {open && (
          <PackageEditorForm
            key={pack?.packageId ?? "__new__"}
            pack={pack}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PackageEditorForm({
  pack,
  onClose,
}: {
  pack: AdminPackageRow | null;
  onClose: () => void;
}) {
  const isEdit = pack !== null;
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(pack));
  const [reason, setReason] = React.useState<ReasonState>({
    code: "",
    text: "",
  });

  const close = onClose;
  const create = useCreateCreditPackage(close);
  const update = useUpdateCreditPackage(close);
  const busy = create.isPending || update.isPending;

  const priceMinor = rupeesToPaise(draft.priceRupees);
  const mrpMinor = rupeesToPaise(draft.mrpRupees);

  const problems: string[] = [];
  if (!isEdit && !/^[A-Z0-9_]{1,32}$/.test(draft.code.trim())) {
    problems.push(
      "A code of A–Z, 0–9 and underscores is required, and it cannot be changed later.",
    );
  }
  if (draft.label.trim().length === 0) {
    problems.push(
      "A label is required — it is what the buyer reads on the card.",
    );
  }
  if (priceMinor === undefined) {
    problems.push(
      "A price is required. Zero is valid and means a campaign giveaway.",
    );
  }
  if (
    mrpMinor !== undefined &&
    priceMinor !== undefined &&
    mrpMinor < priceMinor
  ) {
    problems.push(
      "A strike-through price below the real price advertises a discount that does not exist.",
    );
  }
  if (draft.kind === "PACK" && toIntOrNull(draft.credits) === null) {
    problems.push("A pack must grant at least one credit.");
  }
  if (draft.kind === "PASS") {
    if (toIntOrNull(draft.passDays) === null) {
      problems.push("A pass must last at least one day.");
    }
    if (toIntOrNull(draft.passDailyRunCap) === null) {
      problems.push(
        "A pass needs a fair-use daily run cap — an uncapped pass is an uncapped bill.",
      );
    }
  }

  const canSubmit = problems.length === 0 && isReasonValid(reason) && !busy;

  function submit() {
    if (!canSubmit || !reason.code) return;
    const payload: AdminPackageUpsertRequest = {
      label: draft.label.trim(),
      description: draft.description.trim() || undefined,
      priceMinor,
      mrpMinor: mrpMinor ?? null,
      currency: draft.currency,
      active: draft.active,
      featured: draft.featured,
      displayOrder: Number(draft.displayOrder) || 0,
      credits: draft.kind === "PACK" ? toIntOrNull(draft.credits) : null,
      passDays: draft.kind === "PASS" ? toIntOrNull(draft.passDays) : null,
      passDailyRunCap:
        draft.kind === "PASS" ? toIntOrNull(draft.passDailyRunCap) : null,
      reasonCode: reason.code,
      reason: reason.text.trim(),
    };
    if (isEdit && pack) {
      update.mutate({ packageId: pack.packageId, payload });
    } else {
      create.mutate({
        ...payload,
        code: draft.code.trim().toUpperCase(),
        kind: draft.kind,
      });
    }
  }

  const perCredit =
    draft.kind === "PACK" &&
    priceMinor !== undefined &&
    toIntOrNull(draft.credits)
      ? priceMinor / 100 / (toIntOrNull(draft.credits) as number)
      : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? `Edit ${pack?.code}` : "New package"}
        </DialogTitle>
        <DialogDescription>
          Prices, credit counts and pass terms take effect immediately and need
          no deploy. Every change is recorded in the audit trail with the
          previous values, because this table holds only current state.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pkg-code">
              Code {!isEdit && <span aria-hidden="true">*</span>}
            </Label>
            <Input
              id="pkg-code"
              value={draft.code}
              disabled={isEdit || busy}
              onChange={(e) =>
                setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
              }
              placeholder="PACK_PRO"
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {isEdit
                ? "Immutable. Every purchase and every pass sold under it references this code."
                : "A–Z, 0–9 and underscores. Cannot be changed once anything is sold under it."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-kind">Kind</Label>
            <Select
              value={draft.kind}
              disabled={isEdit || busy}
              onValueChange={(kind) =>
                setDraft((d) => ({ ...d, kind: kind as "PACK" | "PASS" }))
              }
            >
              <SelectTrigger id="pkg-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PACK">Pack — grants credits</SelectItem>
                <SelectItem value="PASS">
                  Pass — bypasses debits for a window
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {isEdit
                ? "Immutable. Switching would reinterpret every past purchase."
                : "A pass never mints credits — minted credits would survive its expiry."}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pkg-label">
            Label <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="pkg-label"
            value={draft.label}
            disabled={busy}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Pro pack"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pkg-description">Description</Label>
          <Input
            id="pkg-description"
            value={draft.description}
            disabled={busy}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="75 credits at the best per-credit rate for a single job search."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pkg-price">
              Price (₹) <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="pkg-price"
              inputMode="decimal"
              value={draft.priceRupees}
              disabled={busy}
              onChange={(e) =>
                setDraft((d) => ({ ...d, priceRupees: e.target.value }))
              }
              placeholder="249"
            />
            {perCredit !== null && (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                ₹{perCredit.toFixed(2)} per credit
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-mrp">Strike-through (₹)</Label>
            <Input
              id="pkg-mrp"
              inputMode="decimal"
              value={draft.mrpRupees}
              disabled={busy}
              onChange={(e) =>
                setDraft((d) => ({ ...d, mrpRupees: e.target.value }))
              }
              placeholder="optional"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank unless the discount is real.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-order">Display order</Label>
            <Input
              id="pkg-order"
              inputMode="numeric"
              value={draft.displayOrder}
              disabled={busy}
              onChange={(e) =>
                setDraft((d) => ({ ...d, displayOrder: e.target.value }))
              }
            />
          </div>
        </div>

        {draft.kind === "PACK" ? (
          <div className="space-y-1.5">
            <Label htmlFor="pkg-credits">
              Credits granted <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="pkg-credits"
              inputMode="numeric"
              value={draft.credits}
              disabled={busy}
              onChange={(e) =>
                setDraft((d) => ({ ...d, credits: e.target.value }))
              }
              placeholder="75"
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-days">
                Pass length (days) <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="pkg-days"
                inputMode="numeric"
                value={draft.passDays}
                disabled={busy}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, passDays: e.target.value }))
                }
                placeholder="7"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pkg-cap">
                Fair-use runs/day <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="pkg-cap"
                inputMode="numeric"
                value={draft.passDailyRunCap}
                disabled={busy}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, passDailyRunCap: e.target.value }))
                }
                placeholder="30"
              />
              <p className="text-[11px] text-muted-foreground">
                Frozen onto every pass sold from here, so changing it never
                alters a pass someone already paid for.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor="pkg-active"
          >
            <Switch
              id="pkg-active"
              checked={draft.active}
              disabled={busy}
              onCheckedChange={(active) => setDraft((d) => ({ ...d, active }))}
            />
            On sale
          </label>
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor="pkg-featured"
          >
            <Switch
              id="pkg-featured"
              checked={draft.featured}
              disabled={busy}
              onCheckedChange={(featured) =>
                setDraft((d) => ({ ...d, featured }))
              }
            />
            Most popular
          </label>
        </div>

        <ReasonField
          value={reason}
          onChange={setReason}
          disabled={busy}
          idPrefix="pkg"
        />

        {problems.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Not ready to save</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1 text-xs">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="text-xs">
            Deactivating is the only removal. A deleted SKU would orphan every
            purchase record and every pass that names its code, and would leave
            a later refund unable to work out how many credits to revoke.
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={close} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={!canSubmit}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create package"}
        </Button>
      </DialogFooter>
    </>
  );
}
