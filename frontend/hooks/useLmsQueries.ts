"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pushToast } from "@/store/ui";
import {
  assignStudentToBatch,
  assignTeacher,
  createBatch,
  deleteBatch,
  enrollStudent,
  getBatchDetail,
  getBatches,
  removeStudentFromBatch,
  removeTeacher
} from "@/services/batches";
import { updateBatch } from "@/services/batches";
import {
  addContent,
  createCourse,
  createModule,
  createSubCourse,
  deleteContent,
  deleteCourse,
  deleteSubCourse,
  getCourses,
  getCoursesByInstitute,
  getModuleContents,
  getModules,
  getTecaiExam,
  previewGeneratedQuiz,
  getPublicCourses,
  getPublicSubCourses,
  getSubCourses,
  getSubCoursesByInstitute,
  getStudentBatchWorkspace,
  getStudentBatches,
  getStudentCourses,
  getStudentDashboard,
  getStudentModules,
  submitStudentContentResponse,
  updateContent,
  updateCourse,
  updateSubCourse
} from "@/services/courses";
import {
  createInstitute,
  deleteInstitute,
  getInstitutes,
  updateInstitute
} from "@/services/institutes";
import { getMyProgress, markProgress } from "@/services/progress";
import { getReviewableSubmissions, reviewSubmission } from "@/services/submissions";
import {
  approveUser,
  createUser,
  deleteUser,
  getUsers,
  getUsersByInstitute,
  updateProfile,
  updateUser
} from "@/services/users";

export function useInstitutesQuery(options?: { refetchInterval?: number }) {
  return useQuery({ queryKey: ["institutes"], queryFn: getInstitutes, refetchInterval: options?.refetchInterval });
}

export function useUsersQuery(options?: { refetchInterval?: number }) {
  return useQuery({ queryKey: ["users"], queryFn: getUsers, refetchInterval: options?.refetchInterval });
}

export function useUsersByInstituteQuery(instituteId?: string, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: ["users", "institute", instituteId ?? "current"],
    queryFn: () => getUsersByInstitute(instituteId),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval
  });
}

export function useCoursesQuery(options?: { refetchInterval?: number }) {
  return useQuery({ queryKey: ["courses"], queryFn: getCourses, refetchInterval: options?.refetchInterval });
}

export function useCoursesByInstituteQuery(instituteId?: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["courses", "institute", instituteId ?? "current"],
    queryFn: () => getCoursesByInstitute(instituteId),
    refetchInterval: options?.refetchInterval
  });
}

export function useSubCoursesQuery(courseId?: string) {
  return useQuery({
    queryKey: ["subcourses", courseId ?? "all"],
    queryFn: () => getSubCourses(courseId)
  });
}

export function useSubCoursesByInstituteQuery(params?: {
  institute_id?: string;
  course_id?: string;
}) {
  return useQuery({
    queryKey: ["subcourses", "institute", params?.institute_id ?? "current", params?.course_id ?? "all"],
    queryFn: () => getSubCoursesByInstitute(params)
  });
}

export function useModulesQuery(
  filters?: { course_id?: string; subcourse_id?: string; institute_id?: string },
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: ["modules", filters?.institute_id ?? "current", filters?.course_id ?? "all", filters?.subcourse_id ?? "all"],
    queryFn: () => getModules(filters),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval
  });
}

export function useModuleContentsQuery(moduleId?: string, batchId?: string) {
  return useQuery({
    queryKey: ["module-contents", batchId ?? "none", moduleId ?? "none"],
    queryFn: () => getModuleContents(moduleId as string, batchId as string),
    enabled: Boolean(moduleId && batchId)
  });
}

export function useTecaiExamQuery(contentId?: string) {
  return useQuery({
    queryKey: ["tecai-exam", contentId ?? "none"],
    queryFn: () => getTecaiExam(contentId as string),
    enabled: Boolean(contentId)
  });
}

export function useBatchesQuery(instituteId?: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["batches", instituteId ?? "current"],
    queryFn: () => getBatches(instituteId),
    refetchInterval: options?.refetchInterval
  });
}

export function useBatchDetailQuery(batchId?: string, instituteId?: string) {
  return useQuery({
    queryKey: ["batch-detail", batchId, instituteId ?? "current"],
    queryFn: () => getBatchDetail(batchId as string, instituteId),
    enabled: Boolean(batchId)
  });
}

export function usePublicCoursesQuery() {
  return useQuery({ queryKey: ["public-courses"], queryFn: getPublicCourses });
}

export function usePublicSubCoursesQuery(courseId?: string) {
  return useQuery({
    queryKey: ["public-subcourses", courseId],
    queryFn: () => getPublicSubCourses(courseId),
    enabled: Boolean(courseId)
  });
}

export function useStudentCoursesQuery() {
  return useQuery({ queryKey: ["student-courses"], queryFn: getStudentCourses });
}

export function useStudentDashboardQuery(options?: { refetchInterval?: number }) {
  return useQuery({ queryKey: ["student-dashboard"], queryFn: getStudentDashboard, refetchInterval: options?.refetchInterval });
}

export function useStudentBatchesQuery() {
  return useQuery({ queryKey: ["student-batches"], queryFn: getStudentBatches });
}

export function useStudentModulesQuery() {
  return useQuery({ queryKey: ["student-modules"], queryFn: getStudentModules });
}

export function useStudentBatchWorkspaceQuery(batchId?: string, category?: string) {
  return useQuery({
    queryKey: ["student-batch-workspace", batchId ?? "none", category ?? "all"],
    queryFn: () => getStudentBatchWorkspace(batchId as string, category),
    enabled: Boolean(batchId)
  });
}

export function useProgressQuery(options?: { refetchInterval?: number }) {
  return useQuery({ queryKey: ["progress"], queryFn: getMyProgress, refetchInterval: options?.refetchInterval });
}

export function useReviewableSubmissionsQuery(batchId?: string, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: ["reviewable-submissions", batchId ?? "all"],
    queryFn: () => getReviewableSubmissions(batchId),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval
  });
}

export function useCreateInstituteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
      pushToast("Institute created successfully.", "success");
    }
  });
}

export function useUpdateInstituteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instituteId, payload }: { instituteId: string; payload: Parameters<typeof updateInstitute>[1] }) =>
      updateInstitute(instituteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
      pushToast("Institute updated successfully.", "success");
    }
  });
}

export function useDeleteInstituteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
      pushToast("Institute deactivated successfully.", "success");
    }
  });
}

export function useApproveUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload
    }: {
      userId: string;
      payload?: Parameters<typeof approveUser>[1];
    }) => approveUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User approval updated.", "success");
    }
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User updated successfully.", "success");
    }
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User created successfully.", "success");
    }
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User deactivated successfully.", "success");
    }
  });
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => pushToast("Profile updated successfully.", "success")
  });
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["public-courses"] });
      pushToast("Course created successfully.", "success");
    }
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["public-courses"] });
      pushToast("Course updated successfully.", "success");
    }
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["subcourses"] });
      queryClient.invalidateQueries({ queryKey: ["public-courses"] });
      queryClient.invalidateQueries({ queryKey: ["public-subcourses"] });
      pushToast("Course deactivated successfully.", "success");
    }
  });
}

export function useCreateSubCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcourses"] });
      queryClient.invalidateQueries({ queryKey: ["public-subcourses"] });
      pushToast("SubCourse created successfully.", "success");
    }
  });
}

export function useUpdateSubCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subcourseId, payload }: { subcourseId: string; payload: Parameters<typeof updateSubCourse>[1] }) =>
      updateSubCourse(subcourseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcourses"] });
      queryClient.invalidateQueries({ queryKey: ["public-subcourses"] });
      pushToast("SubCourse updated successfully.", "success");
    }
  });
}

export function useDeleteSubCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcourses"] });
      queryClient.invalidateQueries({ queryKey: ["public-subcourses"] });
      pushToast("SubCourse deactivated successfully.", "success");
    }
  });
}

export function useCreateModuleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      pushToast("Module created successfully.", "success");
    }
  });
}

export function useAddContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addContent,
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ["module-contents", content.batch_id, content.module_id] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      pushToast("Content added successfully.", "success");
    }
  });
}

export function useQuizPreviewMutation() {
  return useMutation({
    mutationFn: previewGeneratedQuiz
  });
}

export function useUpdateContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: Parameters<typeof updateContent>[1] }) =>
      updateContent(contentId, payload),
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ["module-contents", content.batch_id, content.module_id] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      pushToast("Content updated successfully.", "success");
    }
  });
}

export function useDeleteContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, moduleId, batchId }: { contentId: string; moduleId: string; batchId: string }) =>
      deleteContent(contentId).then((result) => ({ ...result, moduleId, batchId })),
    onSuccess: ({ moduleId, batchId }) => {
      queryClient.invalidateQueries({ queryKey: ["module-contents", batchId, moduleId] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      pushToast("Content deleted successfully.", "success");
    }
  });
}

export function useSubmitStudentContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitStudentContentResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      pushToast("Response submitted successfully.", "success");
    }
  });
}

export function useCreateBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      pushToast("Batch created successfully.", "success");
    }
  });
}

export function useUpdateBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: Parameters<typeof updateBatch>[1] }) =>
      updateBatch(batchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      pushToast("Batch updated successfully.", "success");
    }
  });
}

export function useDeleteBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      pushToast("Batch deleted successfully.", "success");
    }
  });
}

export function useAssignTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      pushToast("Teacher assigned to batch.", "success");
    }
  });
}

export function useAssignStudentBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignStudentToBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      pushToast("Student assigned to batch.", "success");
    }
  });
}

export function useRemoveTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      pushToast("Teacher removed from batch.", "success");
    }
  });
}

export function useRemoveStudentBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeStudentFromBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("Student removed from batch.", "success");
    }
  });
}

export function useEnrollStudentMutation() {
  return useMutation({
    mutationFn: enrollStudent,
    onSuccess: () => pushToast("Student enrolled successfully.", "success")
  });
}

export function useMarkProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-modules"] });
      pushToast("Progress updated.", "success");
    }
  });
}

export function useReviewSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      payload
    }: {
      submissionId: string;
      payload: Parameters<typeof reviewSubmission>[1];
    }) => reviewSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewable-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      pushToast("Submission reviewed successfully.", "success");
    }
  });
}
