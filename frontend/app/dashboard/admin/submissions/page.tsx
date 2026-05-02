import { SubmissionReviewWorkspace } from "@/components/submissions/SubmissionReviewWorkspace";

export default function AdminSubmissionsPage() {
  return (
    <SubmissionReviewWorkspace
      badge="Admin Review Desk"
      title="Institute submissions and grading"
      description="Review student quiz attempts, activity work, and teacher-evaluated progress from one institute-wide submission queue."
    />
  );
}
