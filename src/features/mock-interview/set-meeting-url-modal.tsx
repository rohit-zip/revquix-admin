"use client"

import { useState } from "react"
import { Loader2, Link2 } from "lucide-react"
import { toast } from "sonner"
import { setMeetingUrl } from "@/features/book-slot/api/meeting.api"
import { ApiError } from "@/lib/api-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SetMeetingUrlModalProps {
  sessionId: string
  onSuccess?: () => void
}

const GOOGLE_MEET_REGEX = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/

/**
 * Modal for mentors to manually set a Google Meet URL for a session.
 * Used when the mentor hasn't connected Google Calendar (manual mode).
 */
export function SetMeetingUrlModal({ sessionId, onSuccess }: SetMeetingUrlModalProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validateUrl(value: string): string | null {
    if (!value.trim()) return "Meeting URL is required"
    if (!GOOGLE_MEET_REGEX.test(value.trim())) {
      return "Must be a valid Google Meet URL (https://meet.google.com/xxx-xxxx-xxx)"
    }
    return null
  }

  async function handleSubmit() {
    const validationError = validateUrl(url)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await setMeetingUrl(sessionId, url.trim())
      toast.success("Meeting link set successfully! The participant has been notified.")
      setOpen(false)
      setUrl("")
      onSuccess?.()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to set meeting URL. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Link2 className="size-4" />
          Set Meeting Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Google Meet Link</DialogTitle>
          <DialogDescription>
            Create a Google Meet meeting and paste the link below. The participant will be
            notified once the link is set.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-url">Google Meet URL</Label>
            <Input
              id="meeting-url"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(null)
              }}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">How to create a Google Meet link:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">meet.google.com</a></li>
              <li>Click &quot;New meeting&quot; → &quot;Create a meeting for later&quot;</li>
              <li>Copy the link and paste it above</li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !url.trim()}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Set Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

