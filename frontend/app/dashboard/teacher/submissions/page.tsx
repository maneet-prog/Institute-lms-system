import { SubmissionReviewWorkspace } from "@/components/submissions/SubmissionReviewWorkspace";

export default function TeacherSubmissionsPage() {
  return (
    <SubmissionReviewWorkspace
      badge="Teacher Review Desk"
      title="Student submissions and grading"
      description="Review quiz attempts, written answers, and uploaded activity work for your assigned batches."
    />
  );
}
