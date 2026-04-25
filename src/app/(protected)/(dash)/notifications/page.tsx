import { Bell } from "lucide-react"
import { AdminNotificationInbox } from "@/features/notifications/components/admin-notification-inbox"

export const metadata = {
  title: "Notifications | Revquix Admin",
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Bell className="h-5 w-5" />
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal notification inbox. Platform management tools are under the Notifications
          section in the sidebar.
        </p>
      </div>

      <AdminNotificationInbox />
    </div>
  )
}
