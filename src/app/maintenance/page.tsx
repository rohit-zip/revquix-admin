 import Logo from "@/components/logo"
import { Wrench } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo size={48} />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Wrench className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Under Maintenance</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          The admin panel is temporarily unavailable for scheduled maintenance.
          Please check back shortly.
        </p>
      </div>
    </div>
  )
}

