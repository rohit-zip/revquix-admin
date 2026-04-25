import { Send } from "lucide-react"
import { SendNotificationForm } from "@/features/notifications/components/send-notification-form"

export const metadata = {
  title: "Send Notification | Revquix Admin",
}

export default function SendNotificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Send className="h-5 w-5" />
          Send Notification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compose and dispatch notifications to individual users, roles, or the entire platform.
        </p>
      </div>

      <SendNotificationForm />
    </div>
  )
}
