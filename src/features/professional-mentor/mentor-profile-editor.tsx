/**
 * ─── MENTOR PROFILE EDITOR ───────────────────────────────────────────────────
 *
 * Form for editing professional mentor profile, pricing, resume, and availability.
 */

"use client"

import React, { useEffect, useRef, useState } from "react"
import { FileText, Loader2, Save, Trash2, Upload } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useMentorProfile,
  useUpdateMentorProfile,
  useUpdatePricing,
  useToggleAvailability,
  useUploadMentorResume,
  useDeleteMentorResume,
} from "./api/professional-mentor.hooks"
import type { UpdateMentorProfileRequest, UpdatePricingRequest } from "./api/professional-mentor.types"

export default function MentorProfileEditor() {
  const { data: profile, isLoading } = useMentorProfile()
  const updateProfileMutation = useUpdateMentorProfile()
  const updatePricingMutation = useUpdatePricing()
  const toggleMutation = useToggleAvailability()
  const uploadResumeMutation = useUploadMentorResume()
  const deleteResumeMutation = useDeleteMentorResume()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profileForm, setProfileForm] = useState<UpdateMentorProfileRequest>({})
  const [pricingForm, setPricingForm] = useState<UpdatePricingRequest>({
    priceInrPaise: 0,
    priceUsdCents: 0,
  })

  useEffect(() => {
    if (profile) {
      setProfileForm({
        headline: profile.headline,
        bio: profile.bio,
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl ?? "",
        currentCompany: profile.currentCompany ?? "",
        currentRole: profile.currentRole ?? "",
        yearsOfExperience: profile.yearsOfExperience,
      })
      setPricingForm({
        priceInrPaise: profile.priceInrPaise ?? 0,
        priceUsdCents: profile.priceUsdCents ?? 0,
      })
    }
  }, [profile])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!profile) {
    return <p className="text-muted-foreground">Mentor profile not found.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mentor Profile</h1>
          <p className="text-muted-foreground">Manage your professional mentor profile.</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="availability" className="text-sm">
            Accepting Bookings
          </Label>
          <Switch
            id="availability"
            checked={profile.isAcceptingBookings}
            onCheckedChange={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          />
        </div>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={profileForm.headline ?? ""}
              onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={profileForm.bio ?? ""}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              rows={5}
              minLength={100}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={profileForm.linkedinUrl ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Portfolio URL</Label>
              <Input
                value={profileForm.portfolioUrl ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, portfolioUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={profileForm.currentCompany ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, currentCompany: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={profileForm.currentRole ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, currentRole: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={profileForm.yearsOfExperience ?? 0}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, yearsOfExperience: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <Button
            onClick={() => updateProfileMutation.mutate(profileForm)}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
          <CardDescription>
            Set your session price in both INR and USD. Amounts in minor units (paise/cents).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Price (INR ₹)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={100}
                  step={50}
                  value={pricingForm.priceInrPaise / 100}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, priceInrPaise: Number(e.target.value) * 100 })
                  }
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  ₹{(pricingForm.priceInrPaise / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price (USD $)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={2}
                  step={1}
                  value={pricingForm.priceUsdCents / 100}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, priceUsdCents: Number(e.target.value) * 100 })
                  }
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  ${(pricingForm.priceUsdCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => updatePricingMutation.mutate(pricingForm)}
            disabled={updatePricingMutation.isPending}
          >
            {updatePricingMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Update Pricing
          </Button>
        </CardContent>
      </Card>

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.resumeUrl ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm">Resume uploaded</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteResumeMutation.mutate()}
                  disabled={deleteResumeMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-6 transition hover:border-primary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload resume (PDF, max 10MB)
              </span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadResumeMutation.mutate(f)
            }}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{profile.averageRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.totalReviews}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

