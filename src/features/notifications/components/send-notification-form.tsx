"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { ExternalLink, Plus, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAdminSendNotification } from "../api/notifications.hooks"
import {
  NOTIFICATION_TYPE_OPTIONS,
  ROLE_OPTIONS,
  type NotificationType,
  type SendNotificationRequest,
} from "../api/notifications.types"

interface ActionButtonField {
  label: string
  url: string
}

interface SendNotificationFormValues {
  title: string
  message: string
  type: NotificationType
  targetUserId: string
  targetRole: string
  sendEmail: boolean
  actionButtons: ActionButtonField[]
}

const DEFAULT_VALUES: SendNotificationFormValues = {
  title: "",
  message: "",
  type: "CUSTOM",
  targetUserId: "",
  targetRole: "",
  sendEmail: false,
  actionButtons: [],
}

export function SendNotificationForm() {
  const { mutate: send, isPending } = useAdminSendNotification()
  const [notifType, setNotifType] = useState<NotificationType>("CUSTOM")
  const [targetRole, setTargetRole] = useState("")
  const [sendEmail, setSendEmail] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SendNotificationFormValues>({ defaultValues: DEFAULT_VALUES })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "actionButtons",
  })

  const onSubmit = (values: SendNotificationFormValues) => {
    // Filter out blank rows; map to the Map<String,String> shape the backend expects
    const actionButtons = values.actionButtons
      .filter((btn) => btn.label.trim() && btn.url.trim())
      .map((btn) => ({ label: btn.label.trim(), url: btn.url.trim() }))

    const request: SendNotificationRequest = {
      title: values.title.trim(),
      message: values.message.trim() || null,
      type: notifType,
      sendEmail,
      targetUserId: values.targetUserId.trim() || null,
      targetRole: targetRole || null,
      actionButtons: actionButtons.length > 0 ? actionButtons : null,
    }

    send(request, {
      onSuccess: () => {
        reset()
        setNotifType("CUSTOM")
        setTargetRole("")
        setSendEmail(false)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4" />
          Send Notification
        </CardTitle>
        <CardDescription>
          Send a notification to a specific user, a role group, or broadcast to everyone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-title">Title *</Label>
            <Input
              id="notif-title"
              placeholder="Notification title"
              {...register("title", { required: "Title is required", maxLength: 255 })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-message">Message</Label>
            <Textarea
              id="notif-message"
              placeholder="Optional notification body text"
              rows={3}
              {...register("message")}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Notification Type *</Label>
            <Select value={notifType} onValueChange={(v) => setNotifType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Target User ID */}
            <div className="space-y-1.5">
              <Label htmlFor="notif-user">Target User ID</Label>
              <Input
                id="notif-user"
                placeholder="USR0000001 (leave blank for role/broadcast)"
                {...register("targetUserId")}
              />
              <p className="text-[11px] text-muted-foreground">
                Takes priority over role selection.
              </p>
            </div>

            {/* Target Role */}
            <div className="space-y-1.5">
              <Label>Target Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All users (broadcast)" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter((opt) => opt.value !== "").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Ignored if a User ID is provided.
              </p>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Action Buttons
                </Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Add up to 3 CTA buttons shown inside the notification. Each needs a label and a URL.
                </p>
              </div>
              {fields.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: "", url: "" })}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add button
                </Button>
              )}
            </div>

            {fields.length > 0 && (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 rounded-md border bg-muted/30 p-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Label *
                        </Label>
                        <Input
                          placeholder="e.g. View Booking"
                          className="h-8 text-sm"
                          {...register(`actionButtons.${index}.label`, {
                            required: "Label is required",
                          })}
                        />
                        {errors.actionButtons?.[index]?.label && (
                          <p className="text-[10px] text-destructive">
                            {errors.actionButtons[index]?.label?.message}
                          </p>
                        )}
                      </div>
                      <div className="flex-2 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          URL *
                        </Label>
                        <Input
                          placeholder="e.g. /booking or https://…"
                          className="h-8 text-sm"
                          {...register(`actionButtons.${index}.url`, {
                            required: "URL is required",
                          })}
                        />
                        {errors.actionButtons?.[index]?.url && (
                          <p className="text-[10px] text-destructive">
                            {errors.actionButtons[index]?.url?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Send Email */}
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Switch
              id="notif-email"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
            />
            <div>
              <Label htmlFor="notif-email" className="cursor-pointer font-medium">
                Also send via email
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Sends an email to the target user(s) who have email notifications enabled.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={isPending}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isPending ? "Sending…" : "Send Notification"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

