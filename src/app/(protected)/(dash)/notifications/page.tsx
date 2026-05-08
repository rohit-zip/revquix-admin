import { Bell, Settings2 } from "lucide-react"
import { AdminNotificationInbox } from "@/features/notifications/components/admin-notification-inbox"
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <AdminNotificationInbox />
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  )
}
