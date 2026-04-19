import PageGuard from "@/components/page-guard"
import AdminHourlyBookingDetail from "@/features/hourly-session/admin-hourly-booking-detail"

interface HourlyBookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function HourlyBookingDetailPage({ params }: HourlyBookingDetailPageProps) {
  const { id } = await params

  return (
    <PageGuard>
      <div className="container max-w-5xl mx-auto p-4">
        <AdminHourlyBookingDetail bookingId={id} />
      </div>
    </PageGuard>
  )
}

