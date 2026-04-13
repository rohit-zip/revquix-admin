"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MessageSquare,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"

// ── Inline animation helpers (previously from @/features/landing/animation-utils)
import type { Transition, Variants } from "framer-motion"
const makeFadeUp = (_delay: number): Variants => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
})
const makeFadeUpTransition = (delay: number): Transition => ({
  delay, duration: 0.55, ease: "easeOut",
})
import { EmailChipsInput } from "@/components/email-chips-input"
import {
  type BookingCategory,
  BUDGET_RANGES,
  BUSINESS_SERVICES,
  CATEGORY_OPTIONS,
  HIRING_FOR_OPTIONS,
  HIRING_ROLES,
  HIRING_URGENCY_OPTIONS,
  PROJECT_STAGES,
} from "@/config/booking-form.config"
import type { BookingFormState, BookingIntakeRequest, BookingIntakeResponse, FormStep, } from "./types"
import { bookingApi } from "./api"
import BookingSlotSelector from "./booking-slot-selector"

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUpProps = (delay: number) => ({
  variants: makeFadeUp(delay),
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, amount: 0 },
  transition: makeFadeUpTransition(delay),
})

// ─── Input base styles ────────────────────────────────────────────────────────
const inputBase = cn(
  "w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60",
  "outline-none ring-0 transition-all duration-150",
  "focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20",
  "dark:bg-white/[0.03] dark:focus:border-primary-500",
)

const selectBase = cn(
  "w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground",
  "outline-none ring-0 transition-all duration-150",
  "focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20",
  "dark:bg-white/[0.03] dark:focus:border-primary-500",
)

// ─── Initial state ────────────────────────────────────────────────────────────
const INITIAL_FORM: BookingFormState = {
  fullName: "",
  email: "",
  ccEmails: [],
  category: null,
  projectStage: null,
  budgetRange: null,
  businessServices: [],
  hiringFor: null,
  hiringUrgency: null,
  rolesNeeded: [],
  description: "",
}

// ─── Component ────────────────────────────────────────────────────────────────
const BookingIntakeForm = () => {
  const { currentUser } = useAuth()
  const [form, setForm] = useState<BookingFormState>(INITIAL_FORM)
  const [currentStep, setCurrentStep] = useState<FormStep>("category")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [intakeResponse, setIntakeResponse] = useState<BookingIntakeResponse | null>(null)

  // Auto-fill email from logged-in user
  useEffect(() => {
    setForm((prev) => {
      if (currentUser?.email && !prev.email) {
        return {
          ...prev,
          email: currentUser.email,
          fullName: currentUser.name || "",
        }
      }
      return prev
    })
  }, [currentUser?.email, currentUser?.name])

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateStep = (step: FormStep): boolean => {
    const newErrors: typeof errors = {}

    switch (step) {
      case "category":
        if (!form.category) {
          newErrors.category = "Please select your profile type."
        }
        if (!form.fullName.trim()) {
          newErrors.fullName = "Name is required."
        }
        if (!form.email.trim()) {
          newErrors.email = "Email is required."
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          newErrors.email = "Please enter a valid email address."
        }

        if (form.category === "BUSINESS_STARTUP") {
          if (!form.projectStage) {
            newErrors.projectStage = "Please select a project stage."
          }
          if (!form.budgetRange) {
            newErrors.budgetRange = "Please select a budget range."
          }
        } else if (form.category === "HIRING_RECRUITMENT") {
          if (!form.hiringFor) {
            newErrors.hiringFor = "Please select hiring type."
          }
          if (!form.hiringUrgency) {
            newErrors.hiringUrgency = "Please select hiring urgency."
          }
        }
        break

      case "services": {
        if (form.category === "BUSINESS_STARTUP") {
          if (form.businessServices.length === 0) {
            newErrors.services = "Please select at least one service."
          }
        } else if (form.category === "HIRING_RECRUITMENT") {
          if (form.rolesNeeded.length === 0) {
            newErrors.roles = "Please select at least one role."
          }
        }

        if (!form.description.trim()) {
          newErrors.description = "Please describe your requirement."
        } else if (form.description.trim().length < 20) {
          newErrors.description = "Description should be at least 20 characters."
        }
        break
      }

      case "slots":
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCategoryChange = (category: BookingCategory) => {
    setForm((prev) => ({
      ...prev,
      category,
      projectStage: null,
      budgetRange: null,
      businessServices: [],
      hiringFor: null,
      hiringUrgency: null,
      rolesNeeded: [],
      description: "",
    }))
    setErrors({})
  }

  const toggleService = (id: string) => {
    setForm((prev) => {
      const exists = prev.businessServices.includes(id)
      return {
        ...prev,
        businessServices: exists
          ? prev.businessServices.filter((s) => s !== id)
          : [...prev.businessServices, id],
      }
    })
    if (errors.services) {
      setErrors((prev) => ({ ...prev, services: undefined }))
    }
  }

  const toggleRole = (id: string) => {
    setForm((prev) => {
      const exists = prev.rolesNeeded.includes(id)
      return {
        ...prev,
        rolesNeeded: exists
          ? prev.rolesNeeded.filter((r) => r !== id)
          : [...prev.rolesNeeded, id],
      }
    })
    if (errors.roles) {
      setErrors((prev) => ({ ...prev, roles: undefined }))
    }
  }

  const goToStep = (step: FormStep) => {
    // Validate current step before moving forward
    if ((currentStep === "category" && step !== "category") || (currentStep === "services" && step === "slots")) {
      if (!validateStep(currentStep)) {
        return
      }
    }
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    if (!validateStep("services")) {
      return
    }

    setStatus("submitting")

    try {
      const payload: BookingIntakeRequest = {
        fullName: form.fullName,
        ccEmails: form.ccEmails.join(", "),
        category: form.category || "BUSINESS_STARTUP",
      }

      if (form.category === "BUSINESS_STARTUP") {
        payload.projectStage = form.projectStage || undefined
        payload.budgetRange = form.budgetRange || undefined
        payload.businessServices = form.businessServices
      } else if (form.category === "HIRING_RECRUITMENT") {
        payload.hiringFor = form.hiringFor || undefined
        payload.hiringUrgency = form.hiringUrgency || undefined
        payload.rolesNeeded = form.rolesNeeded
      }

      const response = await bookingApi.submitIntake(payload)
      setIntakeResponse(response)
      setStatus("success")
      setCurrentStep("slots")
      showSuccessToast("Booking intake submitted successfully!")
    } catch (error) {
      console.error("[Booking Intake Error]", error)
      setStatus("error")
      showErrorToast(error instanceof Error ? error : new Error("Unknown error occurred"))
    }
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setCurrentStep("category")
    setStatus("idle")
    setErrors({})
    setIntakeResponse(null)
  }

  // ─── Render step content ──────────────────────────────────────────────────
  const renderStepContent = () => {
    return (
      <AnimatePresence mode="wait">
        {currentStep === "category" && (
          <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Step 1 — Your Information
              </p>
              <div className="h-px w-full bg-border" />
            </div>

            {/* Name and Email fields - read only */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <User className="h-3.5 w-3.5 text-primary-500" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  disabled
                  placeholder="Your full name"
                  value={form.fullName}
                  className={cn(inputBase, "cursor-not-allowed opacity-70", errors.fullName && "border-rose-400 focus:ring-rose-500/20")}
                />
                {errors.fullName && <p className="text-xs text-rose-500">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary-500" />
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  placeholder="your@email.com"
                  value={form.email}
                  className={cn(inputBase, "cursor-not-allowed opacity-70", errors.email && "border-rose-400 focus:ring-rose-500/20")}
                />
                {errors.email && <p className="text-xs text-rose-500">{errors.email}</p>}
              </div>
            </div>

            {/* Category selection */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Who Are You?
              </p>
              <div className="h-px w-full bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleCategoryChange(option.id)}
                  className={cn(
                    "group flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                    form.category === option.id
                      ? option.id === "BUSINESS_STARTUP"
                        ? "border-primary-400 bg-primary-500/8 ring-2 ring-primary-500/25 dark:border-primary-500 dark:bg-primary-500/12"
                        : "border-violet-400 bg-violet-500/8 ring-2 ring-violet-500/25 dark:border-violet-500 dark:bg-violet-500/12"
                      : "border-border bg-muted/20 hover:border-primary-300 hover:bg-muted/40 dark:hover:border-primary-700",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      form.category === option.id
                        ? option.id === "BUSINESS_STARTUP"
                          ? "bg-primary-500 text-white"
                          : "bg-violet-500 text-white"
                        : "bg-muted text-muted-foreground group-hover:bg-primary-500/15 group-hover:text-primary-500",
                    )}
                  >
                    {option.id === "BUSINESS_STARTUP" ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <Briefcase className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        form.category === option.id
                          ? option.id === "BUSINESS_STARTUP"
                            ? "text-primary-600 dark:text-primary-400"
                            : "text-violet-600 dark:text-violet-400"
                          : "text-foreground",
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {form.category === option.id && (
                    <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-rose-500">{errors.category}</p>}

            {/* Business fields */}
            {form.category === "BUSINESS_STARTUP" && (
              <>
                <div className="h-px w-full bg-border" />

                {/* Project Stage */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="projectStage" className="text-xs font-semibold text-foreground">
                    Project Stage <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="projectStage"
                    value={form.projectStage || ""}
                    onChange={(e) => handleSelectChange("projectStage", e.target.value)}
                    className={cn(selectBase, errors.projectStage && "border-rose-400")}
                  >
                    <option value="">Select a project stage...</option>
                    {PROJECT_STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                  {errors.projectStage && <p className="text-xs text-rose-500">{errors.projectStage}</p>}
                </div>

                {/* Budget Range */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="budgetRange" className="text-xs font-semibold text-foreground">
                    Budget Range <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="budgetRange"
                    value={form.budgetRange || ""}
                    onChange={(e) => handleSelectChange("budgetRange", e.target.value)}
                    className={cn(selectBase, errors.budgetRange && "border-rose-400")}
                  >
                    <option value="">Select a budget range...</option>
                    {BUDGET_RANGES.map((range) => (
                      <option key={range.id} value={range.id}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                  {errors.budgetRange && <p className="text-xs text-rose-500">{errors.budgetRange}</p>}
                </div>
              </>
            )}

            {/* Hiring fields */}
            {form.category === "HIRING_RECRUITMENT" && (
              <>
                <div className="h-px w-full bg-border" />

                {/* Hiring For */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hiringFor" className="text-xs font-semibold text-foreground">
                    Hiring For <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="hiringFor"
                    value={form.hiringFor || ""}
                    onChange={(e) => handleSelectChange("hiringFor", e.target.value)}
                    className={cn(selectBase, errors.hiringFor && "border-rose-400")}
                  >
                    <option value="">Select hiring type...</option>
                    {HIRING_FOR_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.hiringFor && <p className="text-xs text-rose-500">{errors.hiringFor}</p>}
                </div>

                {/* Hiring Urgency */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hiringUrgency" className="text-xs font-semibold text-foreground">
                    Hiring Urgency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="hiringUrgency"
                    value={form.hiringUrgency || ""}
                    onChange={(e) => handleSelectChange("hiringUrgency", e.target.value)}
                    className={cn(selectBase, errors.hiringUrgency && "border-rose-400")}
                  >
                    <option value="">Select urgency...</option>
                    {HIRING_URGENCY_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.hiringUrgency && <p className="text-xs text-rose-500">{errors.hiringUrgency}</p>}
                </div>
              </>
            )}
          </motion.div>
        )}

        {currentStep === "services" && form.category && (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Step 2 — {form.category === "BUSINESS_STARTUP" ? "Services & Details" : "Roles & Details"}
              </p>
              <div className="h-px w-full bg-border" />
              <p className="text-xs text-muted-foreground">
                {form.category === "BUSINESS_STARTUP"
                  ? "Choose all services that apply."
                  : "Select roles you need to hire for. Choose all that apply."}
              </p>
            </div>

            {/* Business Services */}
            {form.category === "BUSINESS_STARTUP" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BUSINESS_SERVICES.map(({ id, label, icon: Icon }) => {
                  const selected = form.businessServices.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleService(id)}
                      className={cn(
                        "group flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-xs font-medium transition-all duration-200",
                        selected
                          ? "border-primary-400 bg-primary-500/10 text-primary-700 ring-1 ring-primary-500/20 dark:border-primary-500 dark:bg-primary-500/15 dark:text-primary-300"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          selected ? "text-primary-500" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      <span className="leading-tight">{label}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Hiring Roles */}
            {form.category === "HIRING_RECRUITMENT" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {HIRING_ROLES.map(({ id, label }) => {
                  const selected = form.rolesNeeded.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleRole(id)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition-all duration-200",
                        selected
                          ? "border-violet-400 bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded border transition-colors",
                          selected ? "bg-violet-500 border-violet-500" : "border-current",
                        )}
                      />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {form.category === "BUSINESS_STARTUP" && errors.services && (
              <p className="text-xs text-rose-500">{errors.services}</p>
            )}
            {form.category === "HIRING_RECRUITMENT" && errors.roles && (
              <p className="text-xs text-rose-500">{errors.roles}</p>
            )}

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-primary-500" />
                Your Requirement <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe your needs, goals, or challenges..."
                value={form.description}
                onChange={handleTextChange}
                className={cn(
                  inputBase,
                  "resize-none",
                  errors.description && "border-rose-400 focus:ring-rose-500/20",
                )}
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-xs text-rose-500">{errors.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
                )}
                <p className="text-xs text-muted-foreground">{form.description.length}/500</p>
              </div>
            </div>

            {/* CC Emails - Invite Team Members */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Mail className="h-3.5 w-3.5 text-primary-500" />
                Invite Team Members <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <EmailChipsInput
                value={form.ccEmails}
                onChange={(emails) => {
                  setForm((prev) => ({ ...prev, ccEmails: emails }))
                  if (errors.ccEmails) {
                    setErrors((prev) => ({ ...prev, ccEmails: undefined }))
                  }
                }}
                placeholder="email@company.com"
                helperText="Add team members to invite them to this consultation. Press Enter or comma to add."
                error={errors.ccEmails}
              />
            </div>
          </motion.div>
        )}

        {currentStep === "slots" && intakeResponse && (
          <motion.div
            key="slots"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <BookingSlotSelector
              intakeId={intakeResponse.intakeId}
              message={intakeResponse.message}
              onReset={resetForm}
            />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // ─── Error banner ─────────────────────────────────────────────────────────
  const errorBanner = status === "error" && (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-rose-600 dark:border-rose-800/40 dark:bg-rose-900/10 dark:text-rose-400"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex flex-col gap-1">
          <p>Something went wrong. Please try again.</p>
          <a href="mailto:revquix.info@gmail.com" className="underline">
            Contact support if the issue persists
          </a>
        </div>
      </div>
    </motion.div>
  )

  return (
    <section id="booking-form" className="w-full bg-muted/20 py-16 dark:bg-white/1 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <motion.div {...fadeUpProps(0)}>
          <div
            className={cn(
              "flex flex-col gap-6 rounded-2xl border p-6 sm:p-8",
              "border-border bg-background dark:bg-white/2",
            )}
          >
            {/* Step indicator */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {["category", "services", "slots"].map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold transition-all",
                        currentStep === step || (status === "success" && step === "slots")
                          ? "bg-primary-500 text-white"
                          : ["category", "services"].includes(step) &&
                              ["services", "slots"].includes(currentStep)
                            ? "bg-primary-500/30 text-primary-600 dark:text-primary-400"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </div>
                    {idx < 2 && (
                      <div
                        className={cn(
                          "h-px w-6 transition-colors",
                          ["category", "services"].includes(step) &&
                            ["services", "slots"].includes(currentStep)
                            ? "bg-primary-500/30"
                            : "bg-border",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Form content */}
            {renderStepContent()}

            {/* Error banner */}
            {errorBanner}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep !== "category" && currentStep !== "slots" && (
                <button
                  type="button"
                  onClick={() => {
                    const steps: FormStep[] = ["category", "services"]
                    const currentIdx = steps.indexOf(currentStep)
                    if (currentIdx > 0) {
                      setCurrentStep(steps[currentIdx - 1])
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    "border border-border bg-muted/20 text-foreground hover:bg-muted/40",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              {currentStep !== "slots" && (
                <button
                  type="button"
                  disabled={status === "submitting"}
                  onClick={() => {
                    if (currentStep === "category") {
                      goToStep("services")
                    } else if (currentStep === "services") {
                      handleSubmit()
                    }
                  }}
                  className={cn(
                    "group flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200",
                    "bg-primary-600 text-white hover:bg-primary-500 active:scale-[0.98]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    "shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35",
                  )}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {currentStep === "services" ? "Continue to Slots" : "Next"}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By submitting, you agree to our{" "}
              <a href="/legal/privacy-policy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              . No spam, ever.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default BookingIntakeForm

