"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useReviewUserSubmissionMutation } from "@/hooks/useLmsQueries";
import { FileText, CheckCircle, Clock, MessageSquare, Calendar, Award, Target } from "lucide-react";
import { StudentSubmission } from "@/types/lms";

type SubmissionWithDetails = {
  id: string;
  module_id: string;
  module_name: string;
  exam_id: string | null;
  status: string;
  attempts_count: number;
  latest_attempt: {
    attempt_number: number;
    submitted_at: string;
    auto_score: number;
    awarded_marks: number | null;
    max_score: number;
    status: string;
    feedback: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
  } | null;
  course_id: string;
  course_name: string;
  subcourse_id: string;
  subcourse_name: string;
  created_at: string;
};

export function UserSubmissionsTab({ userId, submissions }: UserSubmissionsTabProps) {
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionWithDetails | null>(null);
  const [reviewForm, setReviewForm] = useState({
    awarded_marks: 0,
    feedback: ""
  });

  const reviewSubmission = useReviewUserSubmissionMutation();

  const handleReview = async () => {
    if (!reviewingSubmission) return;

    try {
      await reviewSubmission.mutateAsync({
        userId,
        submissionId: reviewingSubmission.id,
        awarded_marks: reviewForm.awarded_marks,
        feedback: reviewForm.feedback
      });
      setReviewingSubmission(null);
      setReviewForm({ awarded_marks: 0, feedback: "" });
    } catch (error) {
      console.error("Failed to review submission:", error);
    }
  };

  const openReviewModal = (submission: SubmissionWithDetails) => {
    setReviewingSubmission(submission);
    setReviewForm({
      awarded_marks: submission.latest_attempt?.awarded_marks || submission.latest_attempt?.auto_score || 0,
      feedback: submission.latest_attempt?.feedback || ""
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>;
      case "reviewed":
        return <Badge variant="default">Reviewed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No submissions yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{submission.module_name}</h4>
                    {getStatusBadge(submission.status)}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {submission.course_name} - {submission.subcourse_name}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>{submission.attempts_count} attempts</span>
                    </div>

                    {submission.latest_attempt && (
                      <>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span>
                            {submission.latest_attempt.awarded_marks ?? submission.latest_attempt.auto_score}
                            /{submission.latest_attempt.max_score}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {new Date(submission.latest_attempt.submitted_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{submission.latest_attempt.status}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {submission.latest_attempt?.feedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Feedback</span>
                      </div>
                      <p className="text-sm text-gray-700">{submission.latest_attempt.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {submission.status === "submitted" && (
                    <Button
                      size="sm"
                      onClick={() => openReviewModal(submission)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingSubmission}
        onClose={() => {
          setReviewingSubmission(null);
          setReviewForm({ awarded_marks: 0, feedback: "" });
        }}
        title="Review Submission"
      >
        {reviewingSubmission && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold">{reviewingSubmission.module_name}</h4>
              <p className="text-sm text-gray-600">
                {reviewingSubmission.course_name} - {reviewingSubmission.subcourse_name}
              </p>
              <div className="mt-2 text-sm">
                <p>Auto Score: {reviewingSubmission.latest_attempt?.auto_score || 0}</p>
                <p>Max Score: {reviewingSubmission.latest_attempt?.max_score || 0}</p>
              </div>
            </div>

            <Input
              label="Awarded Marks"
              type="number"
              value={reviewForm.awarded_marks}
              onChange={(e) => setReviewForm(prev => ({
                ...prev,
                awarded_marks: parseInt(e.target.value) || 0
              }))}
              min={0}
              max={reviewingSubmission.latest_attempt?.max_score || 100}
            />

            <Textarea
              label="Feedback"
              value={reviewForm.feedback}
              onChange={(e) => setReviewForm(prev => ({
                ...prev,
                feedback: e.target.value
              }))}
              placeholder="Provide feedback for the student..."
              rows={4}
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setReviewingSubmission(null);
                  setReviewForm({ awarded_marks: 0, feedback: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReview}
                disabled={reviewSubmission.isPending}
              >
                {reviewSubmission.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}