import { BarChart3 } from "lucide-react"
import { NotificationAnalytics } from "@/features/notifications/components/notification-analytics"

export const metadata = {
  title: "Notification Analytics | Revquix Admin",
}

export default function NotificationAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <BarChart3 className="h-5 w-5" />
          Notification Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Delivery stats, read rates, and category breakdowns across all platform notifications.
        </p>
      </div>

      <NotificationAnalytics />
    </div>
  )
}
