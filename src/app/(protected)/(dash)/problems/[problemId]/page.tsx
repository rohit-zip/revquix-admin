import PageGuard from "@/components/page-guard"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import { ProblemReviewView } from "@/features/coding-problems/problem-review-view"

export const metadata = {
  title: "Review problem",
}

interface ProblemReviewPageProps {
  params: Promise<{ problemId: string }>
}

export default async function ProblemReviewPage({ params }: ProblemReviewPageProps) {
  const { problemId } = await params

  return (
    <PageGuard
      requireAnyAuthority={[PERMISSIONS.ROLE_ADMIN, PERMISSIONS.PERM_PUBLISH_PROBLEM]}
      label="Coding Problems"
    >
      {/*
        Narrower than the queue at max-w-4xl. This page is read rather than scanned — the whole
        job is reading a problem statement closely enough to notice it was pasted from somewhere
        else — and a 6xl measure makes prose genuinely harder to read.
      */}
      <div className="container mx-auto max-w-4xl p-4">
        <ProblemReviewView problemId={problemId} />
      </div>
    </PageGuard>
  )
}
