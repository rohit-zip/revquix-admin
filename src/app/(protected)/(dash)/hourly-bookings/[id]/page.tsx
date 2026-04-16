import PageGuard from "@/components/page-guard"
import { Card, CardContent } from "@/components/ui/card"

interface HourlyBookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function HourlyBookingDetailPage({ params }: HourlyBookingDetailPageProps) {
  const { id } = await params

  return (
    <PageGuard>
      <div className="container max-w-5xl mx-auto p-4 space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              Admin hourly session detail view for booking {id} coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageGuard>
  )
}

