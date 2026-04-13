/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Booking Form Configuration
 * ──────────────────────────────────────────────────────────────────────────────
 * Centralized configuration for booking intake form
 * Make this dynamic to add/remove services, roles, etc.
 */

import type { LucideIcon } from "lucide-react"
// ─── Business Services ────────────────────────────────────────────────────────
import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  Cloud,
  Code2,
  Globe,
  HelpCircle,
  Lightbulb,
  Megaphone,
  Palette,
  Server,
  ShoppingCart,
  Smartphone,
} from "lucide-react"

export type BusinessService = {
  id: string
  label: string
  icon: LucideIcon
  description?: string
}

export type HiringRole = {
  id: string
  label: string
  icon?: LucideIcon
  description?: string
}

export type ProjectStageOption = {
  id: "IDEA" | "MVP" | "SCALING" | "ALREADY_RUNNING"
  label: string
  description?: string
}

export type BudgetRangeOption = {
  id: "BELOW_50K" | "BETWEEN_50K_2L" | "BETWEEN_2L_10L" | "ABOVE_10L"
  label: string
  description?: string
}

export type HiringForOption = {
  id: "FULL_TIME" | "FREELANCE" | "CONTRACT"
  label: string
  description?: string
}

export type HiringUrgencyOption = {
  id: "IMMEDIATE" | "WITHIN_ONE_MONTH" | "EXPLORING"
  label: string
  description?: string
}

// ─── Business Services Configuration ──────────────────────────────────────────
export const BUSINESS_SERVICES: BusinessService[] = [
  {
    id: "web-dev",
    label: "Web Development",
    icon: Globe,
    description: "Custom websites and web applications",
  },
  {
    id: "mobile-app",
    label: "Mobile App Development",
    icon: Smartphone,
    description: "iOS and Android native/cross-platform apps",
  },
  {
    id: "custom-software",
    label: "Custom Software Development",
    icon: Code2,
    description: "Tailored software solutions for your business",
  },
  {
    id: "marketing",
    label: "Digital Marketing",
    icon: Megaphone,
    description: "SEO, content marketing, paid ads, and more",
  },
  {
    id: "devops",
    label: "DevOps & Cloud",
    icon: Cloud,
    description: "Infrastructure, CI/CD, and cloud solutions",
  },
  {
    id: "it-consulting",
    label: "IT Consulting",
    icon: Lightbulb,
    description: "Technology strategy and advisory",
  },
  {
    id: "ui-ux",
    label: "UI/UX Design",
    icon: Palette,
    description: "User interface and experience design",
  },
  {
    id: "ai-automation",
    label: "AI & Automation",
    icon: BrainCircuit,
    description: "AI solutions and process automation",
  },
  {
    id: "ecommerce",
    label: "E-Commerce Solutions",
    icon: ShoppingCart,
    description: "Online store setup and optimization",
  },
  {
    id: "erp-crm",
    label: "ERP / CRM Integration",
    icon: Briefcase,
    description: "Enterprise resource and customer management",
  },
  {
    id: "api-integration",
    label: "API & Integrations",
    icon: Server,
    description: "Third-party integrations and API development",
  },
  {
    id: "analytics",
    label: "Data & Analytics",
    icon: BarChart3,
    description: "Data analysis and business intelligence",
  },
  {
    id: "business-other",
    label: "Other Requirement",
    icon: HelpCircle,
    description: "Something else you have in mind",
  },
]

// ─── Project Stage Configuration ──────────────────────────────────────────────
export const PROJECT_STAGES: ProjectStageOption[] = [
  {
    id: "IDEA",
    label: "Just an Idea",
    description: "Concept stage, exploring possibilities",
  },
  {
    id: "MVP",
    label: "MVP / Proof of Concept",
    description: "Early version, testing the market",
  },
  {
    id: "SCALING",
    label: "Scaling / Growing",
    description: "Product live, looking to scale",
  },
  {
    id: "ALREADY_RUNNING",
    label: "Already Running",
    description: "Established product, optimization needed",
  },
]

// ─── Budget Range Configuration ───────────────────────────────────────────────
export const BUDGET_RANGES: BudgetRangeOption[] = [
  {
    id: "BELOW_50K",
    label: "Below ₹50K",
    description: "Small projects and experiments",
  },
  {
    id: "BETWEEN_50K_2L",
    label: "₹50K - ₹2L",
    description: "Medium-sized projects",
  },
  {
    id: "BETWEEN_2L_10L",
    label: "₹2L - ₹10L",
    description: "Substantial investment",
  },
  {
    id: "ABOVE_10L",
    label: "Above ₹10L",
    description: "Large-scale enterprise solutions",
  },
]

// ─── Hiring For Configuration ─────────────────────────────────────────────────
export const HIRING_FOR_OPTIONS: HiringForOption[] = [
  {
    id: "FULL_TIME",
    label: "Full-Time Position",
    description: "Permanent, long-term employment",
  },
  {
    id: "FREELANCE",
    label: "Freelance / Contract",
    description: "Project-based or hourly work",
  },
  {
    id: "CONTRACT",
    label: "Contract / Temporary",
    description: "Fixed-term engagement",
  },
]

// ─── Hiring Urgency Configuration ────────────────────────────────────────────
export const HIRING_URGENCY_OPTIONS: HiringUrgencyOption[] = [
  {
    id: "IMMEDIATE",
    label: "Immediate",
    description: "Need to hire ASAP",
  },
  {
    id: "WITHIN_ONE_MONTH",
    label: "Within One Month",
    description: "Want to fill the position soon",
  },
  {
    id: "EXPLORING",
    label: "Exploring",
    description: "Just browsing talent, no rush",
  },
]

// ─── Hiring Roles Configuration ──────────────────────────────────────────────
export const HIRING_ROLES: HiringRole[] = [
  { id: "software-engineer", label: "Software Engineer" },
  { id: "backend-developer", label: "Backend Developer" },
  { id: "frontend-developer", label: "Frontend Developer" },
  { id: "full-stack-developer", label: "Full Stack Developer" },
  { id: "mobile-developer", label: "Mobile Developer" },
  { id: "devops-engineer", label: "DevOps Engineer" },
  { id: "data-engineer", label: "Data Engineer" },
  { id: "ml-engineer", label: "ML Engineer" },
  { id: "qa-engineer", label: "QA Engineer" },
  { id: "product-manager", label: "Product Manager" },
  { id: "ux-designer", label: "UX Designer" },
  { id: "designer", label: "UI/UX Designer" },
  { id: "marketing-specialist", label: "Marketing Specialist" },
  { id: "sales-representative", label: "Sales Representative" },
  { id: "business-analyst", label: "Business Analyst" },
  { id: "project-manager", label: "Project Manager" },
  { id: "other-role", label: "Other Role" },
]

// ─── Category Options ────────────────────────────────────────────────────────
export type BookingCategory = "BUSINESS_STARTUP" | "HIRING_RECRUITMENT"

export const CATEGORY_OPTIONS = [
  {
    id: "BUSINESS_STARTUP" as const,
    label: "Business / Startup",
    description: "Software, marketing, design & more",
  },
  {
    id: "HIRING_RECRUITMENT" as const,
    label: "Hiring & Recruitment",
    description: "Find top talent for your team",
  },
]

