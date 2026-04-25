import { History } from "lucide-react"
import { NotificationHistoryTable } from "@/features/notifications/components/notification-history-table"

export const metadata = {
  title: "Delivery Log | Revquix Admin",
}

export default function NotificationHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <History className="h-5 w-5" />
          Delivery Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full history of every notification sent on the platform, with read and email delivery
          status.
        </p>
      </div>

      <NotificationHistoryTable />
    </div>
  )
}
