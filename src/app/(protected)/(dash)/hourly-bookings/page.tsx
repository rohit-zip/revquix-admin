import PageGuard from "@/components/page-guard"
import AdminHourlyBookingsView from "@/features/hourly-session/admin-hourly-bookings-view"

export default function AdminHourlyBookingsPage() {
  return (
    <PageGuard>
      <div className="container max-w-7xl mx-auto p-4">
        <AdminHourlyBookingsView />
      </div>
    </PageGuard>
  )
}


