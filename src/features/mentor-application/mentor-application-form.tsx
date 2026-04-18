/**
 * ─── MENTOR APPLICATION FORM ──────────────────────────────────────────────────
 *
 * Multi-field form for submitting a professional mentor application.
 * Includes resume upload, category/skill selection, and validation.
 */

"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, FileText, Loader2, Tag, Upload } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useApplyMentor, useCategorySkillLimits } from "./api/mentor-application.hooks"
import type { MentorApplicationRequest } from "./api/mentor-application.types"
import { getAllCategoriesWithSkills } from "@/features/user/api/category.api"
import type { CategoryWithSkills, Skill } from "@/features/user/api/user.types"
import { useAppSelector } from "@/hooks/useRedux"
import { showErrorToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import { cn } from "@/lib/utils"

// ─── Category/Skill Picker ─────────────────────────────────────────────────

function CategorySkillPicker({
  catalogue,
  selectedCategoryIds,
  selectedSkillIds,
  onToggleCategory,
  onToggleSkill,
  maxCategories,
  maxSkills,
}: {
  catalogue: CategoryWithSkills[]
  selectedCategoryIds: string[]
  selectedSkillIds: string[]
  onToggleCategory: (id: string) => void
  onToggleSkill: (skill: Skill) => void
  maxCategories: number
  maxSkills: number
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  /** Toggle category selection and auto-expand on select, auto-collapse on deselect. */
  const handleCategoryToggle = (catId: string) => {
    const isCurrentlySelected = selectedCategoryIds.includes(catId)
    onToggleCategory(catId)
    if (!isCurrentlySelected) {
      // Selecting → auto-expand so skills are immediately visible
      setExpandedCat(catId)
    } else if (expandedCat === catId) {
      // Deselecting → collapse the accordion
      setExpandedCat(null)
    }
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
      {catalogue.map((cat) => {
        const isSelected = selectedCategoryIds.includes(cat.categoryId)
        const isExpanded = expandedCat === cat.categoryId
        const countSelected = cat.skills.filter((s) => selectedSkillIds.includes(s.skillId)).length
        const atCatMax = !isSelected && selectedCategoryIds.length >= maxCategories
        const canExpand = isSelected && cat.skills.length > 0

        return (
          <div
            key={cat.categoryId}
            className={cn(
              "rounded-lg border transition-colors",
              isSelected ? "border-primary/30 bg-primary/5" : "border-border/50",
            )}
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleCategoryToggle(cat.categoryId)}
                disabled={atCatMax}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                  atCatMax && "opacity-40 cursor-not-allowed",
                )}
                aria-label={isSelected ? `Deselect ${cat.name}` : `Select ${cat.name}`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </button>

              {/* Clicking the name row toggles expand/collapse when the category is selected */}
              <p
                className={cn(
                  "flex-1 min-w-0 truncate text-sm font-medium",
                  canExpand && "cursor-pointer select-none",
                )}
                onClick={() => canExpand && setExpandedCat(isExpanded ? null : cat.categoryId)}
              >
                {cat.name}
              </p>

              {isSelected && cat.skills.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {countSelected > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      {countSelected}
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedCat(isExpanded ? null : cat.categoryId)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label={isExpanded ? `Collapse ${cat.name} skills` : `Expand ${cat.name} skills`}
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isSelected && isExpanded && cat.skills.length > 0 && (
                <motion.div
                  key="skills"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/40 px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((skill) => {
                        const isSel = selectedSkillIds.includes(skill.skillId)
                        return (
                          <button
                            key={skill.skillId}
                            type="button"
                            onClick={() => onToggleSkill(skill)}
                            disabled={!isSel && selectedSkillIds.length >= maxSkills}
                            className={cn(
                              "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                              isSel
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border bg-muted/40 hover:border-primary/30",
                              !isSel &&
                                selectedSkillIds.length >= maxSkills &&
                                "opacity-40 cursor-not-allowed",
                            )}
                          >
                            {isSel && <Check className="h-2.5 w-2.5" />}
                            {skill.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Form ──────────────────────────────────────────────────────────────

export default function MentorApplicationForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  // ── Fetch category/skill catalogue and limits ─────────────────────
  const [catalogue, setCatalogue] = useState<CategoryWithSkills[]>([])
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const { data: limits } = useCategorySkillLimits()
  const maxCategories = limits?.maxCategories ?? 6
  const maxSkills = limits?.maxSkills ?? 40

  // ── Pre-populate from current user's categories/skills ────────────
  const currentUser = useAppSelector((state) => state.userProfile.currentUser)
  const initialCats = React.useMemo(
    () => currentUser?.categories?.map((c) => c.categoryId) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.userId],
  )
  const initialSkills = React.useMemo(
    () => currentUser?.skills?.map((s) => s.skillId) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.userId],
  )
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCats)
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(initialSkills)

  useEffect(() => {
    getAllCategoriesWithSkills()
      .then(setCatalogue)
      .catch((err) => showErrorToast(err as ApiError | NetworkError))
      .finally(() => setCatalogueLoading(false))
  }, [])

  // Late-populate if currentUser loads after initial render (e.g. slow auth fetch)
  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current || !currentUser) return
    if (selectedCategoryIds.length === 0 && selectedSkillIds.length === 0) {
      const userCats = currentUser.categories?.map((c) => c.categoryId) ?? []
      const userSkls = currentUser.skills?.map((s) => s.skillId) ?? []
      if (userCats.length > 0 || userSkls.length > 0) {
        // Use a microtask to avoid the synchronous-setState-in-effect lint rule
        queueMicrotask(() => {
          setSelectedCategoryIds(userCats)
          setSelectedSkillIds(userSkls)
        })
      }
    }
    initializedRef.current = true
  }, [currentUser, selectedCategoryIds.length, selectedSkillIds.length])

  const [form, setForm] = useState<MentorApplicationRequest>({
    headline: "",
    bio: "",
    linkedinUrl: "",
    yearsOfExperience: 0,
    currentCompany: "",
    currentRole: "",
    categoryIds: [],
    skillIds: [],
    portfolioUrl: "",
    whyMentor: "",
  })

  const applyMutation = useApplyMentor(() => {
    router.push(PATH_CONSTANTS.MENTOR_APPLICATION)
  })

  const updateField = <K extends keyof MentorApplicationRequest>(
    key: K,
    value: MentorApplicationRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        // Remove category and also remove skills under it
        const catSkillIds =
          catalogue.find((c) => c.categoryId === categoryId)?.skills.map((s) => s.skillId) ?? []
        setSelectedSkillIds((ps) => ps.filter((id) => !catSkillIds.includes(id)))
        return prev.filter((id) => id !== categoryId)
      }
      if (prev.length >= maxCategories) return prev
      return [...prev, categoryId]
    })
  }

  const handleToggleSkill = (skill: Skill) => {
    setSelectedSkillIds((prev) => {
      if (prev.includes(skill.skillId)) return prev.filter((id) => id !== skill.skillId)
      if (prev.length >= maxSkills) return prev
      return [...prev, skill.skillId]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeFile) return
    if (selectedCategoryIds.length === 0 || selectedSkillIds.length === 0) return
    applyMutation.mutate({
      data: { ...form, categoryIds: selectedCategoryIds, skillIds: selectedSkillIds },
      resume: resumeFile,
    })
  }

  const canSubmit =
    !!resumeFile &&
    selectedCategoryIds.length > 0 &&
    selectedSkillIds.length > 0 &&
    !applyMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply to Become a Professional Mentor</CardTitle>
          <CardDescription>
            Share your expertise and help others prepare for interviews. Fill out all
            required fields and upload your resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline *</Label>
            <Input
              id="headline"
              placeholder="e.g., Senior SDE at Google"
              maxLength={200}
              required
              value={form.headline}
              onChange={(e) => updateField("headline", e.target.value)}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio *</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your professional background (min 100 chars)..."
              minLength={100}
              maxLength={5000}
              required
              rows={5}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{form.bio.length}/5000</p>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL *</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              required
              value={form.linkedinUrl}
              onChange={(e) => updateField("linkedinUrl", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience *</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                max={50}
                required
                value={form.yearsOfExperience}
                onChange={(e) => updateField("yearsOfExperience", Number(e.target.value))}
              />
            </div>

            {/* Current Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Current Company</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={form.currentCompany}
                onChange={(e) => updateField("currentCompany", e.target.value)}
              />
            </div>
          </div>

          {/* Current Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Current Role</Label>
            <Input
              id="role"
              placeholder="e.g., Senior Software Engineer"
              value={form.currentRole}
              onChange={(e) => updateField("currentRole", e.target.value)}
            />
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <Input
              id="portfolio"
              type="url"
              placeholder="https://yourportfolio.com"
              value={form.portfolioUrl}
              onChange={(e) => updateField("portfolioUrl", e.target.value)}
            />
          </div>

          {/* Why Mentor */}
          <div className="space-y-2">
            <Label htmlFor="whyMentor">Why do you want to be a mentor? *</Label>
            <Textarea
              id="whyMentor"
              placeholder="Explain your motivation (min 50 chars)..."
              minLength={50}
              maxLength={2000}
              required
              rows={4}
              value={form.whyMentor}
              onChange={(e) => updateField("whyMentor", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{form.whyMentor.length}/2000</p>
          </div>

          {/* ── Categories & Skills ──────────────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <Label>Categories & Skills *</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Select your areas of expertise. Expand a category to pick skills.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span>
                  {selectedCategoryIds.length}/{maxCategories} categories
                </span>
              </div>
              <span>·</span>
              <span>
                {selectedSkillIds.length}/{maxSkills} skills
              </span>
            </div>

            {catalogueLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CategorySkillPicker
                catalogue={catalogue}
                selectedCategoryIds={selectedCategoryIds}
                selectedSkillIds={selectedSkillIds}
                onToggleCategory={handleToggleCategory}
                onToggleSkill={handleToggleSkill}
                maxCategories={maxCategories}
                maxSkills={maxSkills}
              />
            )}

            {selectedCategoryIds.length === 0 && (
              <p className="text-xs text-destructive">Please select at least one category.</p>
            )}
            {selectedCategoryIds.length > 0 && selectedSkillIds.length === 0 && (
              <p className="text-xs text-destructive">
                Please select at least one skill from your chosen categories.
              </p>
            )}
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>Resume (PDF) *</Label>
            <div
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition hover:border-primary"
              onClick={() => fileRef.current?.click()}
            >
              {resumeFile ? (
                <>
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm">{resumeFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload resume (PDF, max 10MB)
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && file.size <= 10 * 1024 * 1024) setResumeFile(file)
              }}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit}
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

