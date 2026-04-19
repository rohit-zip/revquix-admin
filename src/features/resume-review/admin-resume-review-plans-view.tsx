"use client"

import { useAdminResumeReviewPlans } from "./api/resume-review.hooks"
import type { ResumeReviewPlanResponse } from "./api/resume-review.types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminResumeReviewPlansView() {
  const { data: plans, isLoading } = useAdminResumeReviewPlans()

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Review Plans</h1>
        <p className="text-muted-foreground">View and manage resume review pricing plans.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan: ResumeReviewPlanResponse) => (
          <Card key={plan.planId} className={!plan.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Price (INR)</p>
                  <p className="font-semibold">₹{(plan.priceInrPaise / 100).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price (USD)</p>
                  <p className="font-semibold">${(plan.priceUsdCents / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Uploads</p>
                  <p className="font-semibold">{plan.maxResumeUploads}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comment Window</p>
                  <p className="font-semibold">{plan.commentWindowDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">SLA</p>
                  <p className="font-semibold">{plan.slaHours}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sort Order</p>
                  <p className="font-semibold">{plan.sortOrder}</p>
                </div>
              </div>
              {plan.features?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Features</p>
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs flex items-start gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground font-mono">{plan.planKey} · {plan.planId}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

