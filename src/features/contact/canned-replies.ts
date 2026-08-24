/**
 * ─── CANNED REPLY BODIES ─────────────────────────────────────────────────────
 *
 * Phase 4 §7 of `docs/HELP_AND_SUPPORT_MASTER_PLAN.md`.
 *
 * The reply editor already had `subjectPresets` — four ways to fill in a *subject line*, which is
 * the part nobody spends time on. This is the body: the part that actually costs minutes, and the
 * part where three staff answering the same question three different ways is how a support desk
 * starts contradicting itself.
 *
 * ── In a file, not a database ────────────────────────────────────────────────
 *
 * The plan called these "admin-authored", which reads as a CMS. They are not, for the same reason
 * `help-topics.ts` is not: this is a small hand-picked set that ships with the product copy it has
 * to agree with. The refund template repeats the settlement window the deflection panel quotes and
 * the emails quote; putting it in a table means those three drift apart the first time somebody
 * edits one of them. Versioned in git, reviewed in a PR, changed alongside the copy it mirrors.
 *
 * Promote it when — and only when — staff are demonstrably editing these on the fly and wanting
 * their edits to persist. Two tickets in the system is not that moment.
 *
 * ── Every template is a draft, never a send ──────────────────────────────────
 *
 * Inserting one fills the editor and nothing else. Nothing here posts, and none of them close a
 * ticket. A canned reply that could be sent in one click is how somebody sends "we've issued your
 * refund" to a person whose refund was not issued.
 */

/** Fields the templates may interpolate. Anything else is left as literal text. */
export interface CannedReplyContext {
  name: string
  ticketRef: string
}

export interface CannedReply {
  id: string
  label: string
  /** What it is for, so the right one is picked rather than the first one that fits. */
  hint: string
  body: (ctx: CannedReplyContext) => string
}

/** First name only — "Hi Aanchal" reads like a person, "Hi Aanchal Gupta" reads like a mail merge. */
function firstName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "there"
  return trimmed.split(/\s+/)[0]
}

export const CANNED_REPLIES: readonly CannedReply[] = [
  {
    id: "acknowledge",
    label: "Acknowledge & investigating",
    hint: "Buys time honestly when the answer needs digging. Commits to a next update, not a fix.",
    body: (ctx) =>
      `<p>Hi ${firstName(ctx.name)},</p>` +
      `<p>Thanks for writing in — I've picked this up and I'm looking into it now.</p>` +
      `<p>I'll come back to you on this ticket as soon as I know more, and by the end of tomorrow ` +
      `at the latest even if that's only to tell you where I've got to.</p>` +
      `<p>Revquix Support</p>`,
  },
  {
    id: "need-detail",
    label: "Need more detail",
    hint: "Asks for the specific thing that unblocks it, rather than 'please provide more information'.",
    body: (ctx) =>
      `<p>Hi ${firstName(ctx.name)},</p>` +
      `<p>Happy to sort this out — I just need one more thing before I can. Could you reply here ` +
      `with the reference of the booking or payment involved, and roughly when it happened?</p>` +
      `<p>If you have a screenshot of what you're seeing, you can attach it to this ticket directly.</p>` +
      `<p>Revquix Support</p>`,
  },
  {
    id: "refund-in-flight",
    label: "Refund already issued",
    hint: "Mirrors the deflection panel and the refund email. Change all three together or not at all.",
    body: (ctx) =>
      `<p>Hi ${firstName(ctx.name)},</p>` +
      `<p>I've checked and the refund has already been issued from our side. Banks usually take up ` +
      `to 7 working days to show it, so it may not have appeared on your statement yet.</p>` +
      `<p>If it hasn't landed after that, reply here and I'll chase it with the payment gateway ` +
      `directly — quoting <strong>${ctx.ticketRef}</strong> so we keep it all in one place.</p>` +
      `<p>Revquix Support</p>`,
  },
  {
    id: "resolved",
    label: "Resolved — confirming",
    hint: "Says what was done, and that replying reopens. Pair it with marking the ticket completed.",
    body: (ctx) =>
      `<p>Hi ${firstName(ctx.name)},</p>` +
      `<p>This should be sorted now — do take a look and let me know if it isn't what you expected.</p>` +
      `<p>I'll mark the ticket resolved, but replying here reopens it, so there's no need to start ` +
      `a new one if anything's still off.</p>` +
      `<p>Revquix Support</p>`,
  },
  {
    id: "handled-elsewhere",
    label: "Handled on another surface",
    hint: "For things support doesn't own — session disputes, for instance. Points, doesn't transfer.",
    body: (ctx) =>
      `<p>Hi ${firstName(ctx.name)},</p>` +
      `<p>Thanks for flagging this. This one is handled on its own page rather than through a ` +
      `support ticket, so you'll get a faster and more complete answer there — it has the full ` +
      `record of the session attached to it.</p>` +
      `<p>If you hit anything confusing on the way, reply here and I'll help.</p>` +
      `<p>Revquix Support</p>`,
  },
] as const
