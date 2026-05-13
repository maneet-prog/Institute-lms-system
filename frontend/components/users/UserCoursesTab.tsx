"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  useCoursesByInstituteQuery,
  useSubCoursesByInstituteQuery,
  useEnrollUserMutation,
  useRemoveUserEnrollmentMutation
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";
import { Plus, X, BookOpen, Calendar } from "lucide-react";

interface UserCoursesTabProps {
  userId: string;
  courses: {
    enrolled: Array<{
      id: string;
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
      enrolled_at: string;
    }>;
    selected: Array<{
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
    }>;
  };
}

export function UserCoursesTab({ userId, courses }: UserCoursesTabProps) {
  const instituteId = useAuthStore((state) => state.instituteId);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    course_id: "",
    subcourse_id: ""
  });

  const { data: availableCourses = [] } = useCoursesByInstituteQuery(instituteId ?? undefined);
  const { data: availableSubcourses = [] } = useSubCoursesByInstituteQuery(
    instituteId ? { institute_id: instituteId, course_id: enrollForm.course_id || undefined } : undefined
  );

  const enrollUser = useEnrollUserMutation();
  const removeEnrollment = useRemoveUserEnrollmentMutation();

  const handleEnroll = async () => {
    if (!enrollForm.course_id || !enrollForm.subcourse_id) return;

    try {
      await enrollUser.mutateAsync({
        userId,
        course_id: enrollForm.course_id,
        subcourse_id: enrollForm.subcourse_id
      });
      setShowEnrollModal(false);
      setEnrollForm({ course_id: "", subcourse_id: "" });
    } catch (error) {
      console.error("Failed to enroll user:", error);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to remove this enrollment?")) {
      try {
        await removeEnrollment.mutateAsync(enrollmentId);
      } catch (error) {
        console.error("Failed to remove enrollment:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Enroll Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowEnrollModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Enroll in Course
        </Button>
      </div>

      {/* Enrolled Courses */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Enrolled Courses</h3>
        {courses.enrolled.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No enrolled courses</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {courses.enrolled.map((enrollment) => (
              <Card key={enrollment.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{enrollment.course_name}</h4>
                    <p className="text-sm text-gray-600">{enrollment.subcourse_name}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveEnrollment(enrollment.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Selected Courses */}
      {courses.selected.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Selected Courses (Pending Enrollment)</h3>
          <div className="grid gap-4">
            {courses.selected.map((selection, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selection.course_name}</h4>
                    <p className="text-sm text-gray-600">{selection.subcourse_name}</p>
                    <Badge variant="secondary" className="mt-2">Pending</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      <Modal
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll User in Course"
      >
        <div className="space-y-4">
          <Select
            label="Course"
            value={enrollForm.course_id}
            onChange={(e) => setEnrollForm((prev) => ({
              ...prev,
              course_id: e.target.value,
              subcourse_id: "" // Reset subcourse when course changes
            }))}
            options={availableCourses.map((course) => ({
              value: course.course_id,
              label: course.course_name
            }))}
          />

          <Select
            label="Subcourse"
            value={enrollForm.subcourse_id}
            onChange={(e) => setEnrollForm((prev) => ({
              ...prev,
              subcourse_id: e.target.value
            }))}
            options={availableSubcourses.map((subcourse) => ({
              value: subcourse.subcourse_id,
              label: subcourse.subcourse_name
            }))}
            disabled={!enrollForm.course_id}
          />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!enrollForm.course_id || !enrollForm.subcourse_id || enrollUser.isPending}
            >
              {enrollUser.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}