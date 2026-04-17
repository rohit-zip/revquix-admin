/**
 * ─── ADMIN RESUME REVIEW TYPES ──────────────────────────────────────────────
 */

export interface ResumeReviewPlanResponse {
  planId: string
  planKey: string
  displayName: string
  tagline: string | null
  description: string | null
  priceInrPaise: number
  priceUsdCents: number
  maxResumeUploads: number
  commentWindowDays: number
  slaHours: number
  features: string[] | null
  isActive: boolean
  sortOrder: number
}

export interface ResumeReviewBookingResponse {
  bookingId: string
  status: string
  planId: string
  planName: string
  planKey: string
  userId: string
  userName: string
  userEmail: string
  reviewerUserId: string | null
  reviewerName: string | null
  currency: string
  originalAmountMinor: number
  discountAmountMinor: number
  finalAmountMinor: number
  couponCode: string | null
  paymentOrderId: string | null
  razorpayOrderId: string | null
  uploadCount: number
  maxUploads: number
  reportAvailable: boolean
  overallScore: number | null
  commentWindowStatus: string | null
  commentWindowClosesAt: string | null
  ratingStars: number | null
  acceptedAt: string | null
  reportSubmittedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  targetJobRole: string | null
  targetCompany: string | null
  experienceLevel: string | null
}

export interface ResumeReviewReportResponse {
  reportId: string
  bookingId: string
  reviewerName: string
  overallScore: number
  atsCompatibilityScore: number | null
  contentQualityScore: number | null
  formattingScore: number | null
  keywordsScore: number | null
  careerProgressionScore: number | null
  sectionAtsFeedback: string | null
  sectionContentFeedback: string | null
  sectionFormattingFeedback: string | null
  sectionKeywordsFeedback: string | null
  sectionCareerFeedback: string | null
  sectionSummaryFeedback: string | null
  strengths: string[] | null
  improvements: string[] | null
  actionItems: string[] | null
  recommendedChanges: string | null
  reviewerNotes: string | null
  quickTags: string[] | null
  reviewedUploadId: string | null
  createdAt: string
  updatedAt: string
}

export interface ResumeReviewUploadResponse {
  uploadId: string
  versionNumber: number
  originalFilename: string | null
  fileSizeBytes: number | null
  uploadedAt: string
  downloadUrl: string | null
}

export interface ResumeReviewStatusLogResponse {
  fromStatus: string | null
  toStatus: string
  actorName: string
  actorType: string
  notes: string | null
  timestamp: string
}

export interface ResumeReviewAnalyticsResponse {
  totalReviews: number
  completedReviews: number
  avgOverallScore: number
  avgTurnaroundHours: number
  totalRevenueMinor: number
  reviewsByPlan: Record<string, number>
  reviewsByStatus: Record<string, number>
}

export interface SubmitResumeReportRequest {
  overallScore: number
  atsCompatibilityScore?: number
  contentQualityScore?: number
  formattingScore?: number
  keywordsScore?: number
  careerProgressionScore?: number
  sectionAtsFeedback?: string
  sectionContentFeedback?: string
  sectionFormattingFeedback?: string
  sectionKeywordsFeedback?: string
  sectionCareerFeedback?: string
  sectionSummaryFeedback?: string
  strengths?: string[]
  improvements?: string[]
  actionItems?: string[]
  recommendedChanges?: string
  reviewerNotes?: string
  quickTags?: string[]
  reviewedUploadId?: string
}

export interface CancelResumeReviewRequest {
  reason?: string
}

export interface ReassignResumeReviewRequest {
  newReviewerUserId: string
}

