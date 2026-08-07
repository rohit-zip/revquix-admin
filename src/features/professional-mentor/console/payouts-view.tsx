"use client"

/**
 * ─── PAYOUTS ──────────────────────────────────────────────────────────────────
 *
 * Three pages become one page with three tabs.
 *
 * <h3>Why they were merged</h3>
 * Payouts, Mentor Wallets and Payout Reports were three sidebar rows over three views of the same
 * number: what we owe mentors. An operator processing a payout needs the mentor's wallet and account
 * state on the same screen, and doing that used to mean a sidebar round trip that threw away their
 * filters on the way out and on the way back.
 *
 * Tabs keep the filter state and, more importantly, keep the obligation totals fixed above all three
 * — so the number an operator is working against never leaves the screen.
 *
 * <h3>What is deliberately unchanged</h3>
 * The queue itself. It was already the best table in this subsystem — DataExplorer, bulk selection,
 * a server-authoritative "needs review" filter and an inline warning when a selection contains
 * payouts still inside the buyer's dispute window. This page wraps it; it does not rewrite it.
 */

import { useState } from "react"
import { BarChart3, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminPayoutsView from "@/features/professional-mentor/admin-payouts-view"
import PayoutReportsView from "@/features/professional-mentor/payout-reports-view"
import AdminMentorWalletsView from "@/features/payment/admin-mentor-wallets-view"

export default function ProfessionalMentorPayoutsView() {
  const [tab, setTab] = useState("queue")

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Wallet className="size-6" /> Payouts
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          What Revquix owes mentors, and the three views of it: the queue you process, the wallets and
          bank accounts you pay into, and the reports finance reconciles from.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue" className="gap-1.5">
            <Wallet className="size-3.5" /> Queue
          </TabsTrigger>
          <TabsTrigger value="wallets" className="gap-1.5">
            <Wallet className="size-3.5" /> Wallets
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <BarChart3 className="size-3.5" /> Reports
          </TabsTrigger>
        </TabsList>

        {/*
          Each tab mounts only when selected. These are three heavy views — the queue alone runs a
          search plus a stats query — and mounting all three on arrival would fire six requests to
          render one.
        */}
        <TabsContent value="queue" className="mt-4">
          {tab === "queue" ? <AdminPayoutsView /> : null}
        </TabsContent>
        <TabsContent value="wallets" className="mt-4">
          {tab === "wallets" ? <AdminMentorWalletsView /> : null}
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          {tab === "reports" ? <PayoutReportsView /> : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
