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
import { assignResource, removeResource } from "@/services/resources";
import {
  addContent,
  addReusableContent,
  assignReusableContentToBatch,
  createCourse,
  createModule,
  createModuleSubcategory,
  createSubCourse,
  deleteContent,
  deleteReusableContent,
  deleteCourse,
  deleteModule,
  deleteModuleSubcategory,
  deleteSubCourse,
  getCourseModuleExam,
  getCourses,
  getCoursesByInstitute,
  getModuleContents,
  getModules,
  getTecaiExam,
  previewGeneratedQuiz,
  getPublicCourses,
  getPublicSubCourses,
  getReusableModuleContents,
  getSubCourses,
  getSubCoursesByInstitute,
  getStudentBatchWorkspace,
  getStudentBatches,
  getStudentCourses,
  getStudentDashboard,
  getStudentModules,
  submitStudentContentResponse,
  updateStudentContentAccess,
  updateContent,
  updateReusableContent,
  updateCourse,
  updateModule,
  updateModuleSubcategory,
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
  updateUser,
  getUserDetails,
  enrollUser,
  removeUserEnrollment,
  assignUserToBatch,
  removeUserFromBatch,
  createUserContent,
  updateUserContent,
  deleteUserContent,
  reviewUserSubmission
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

export function useReusableModuleContentsQuery(moduleId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["reusable-module-contents", moduleId ?? "none"],
    queryFn: () => getReusableModuleContents(moduleId as string),
    enabled: (options?.enabled ?? true) && Boolean(moduleId)
  });
}

export function useTecaiExamQuery(contentId?: string) {
  return useQuery({
    queryKey: ["tecai-exam", contentId ?? "none"],
    queryFn: () => getTecaiExam(contentId as string),
    enabled: Boolean(contentId)
  });
}

export function useCourseModuleExamQuery(
  courseId?: string,
  examTypeId?: string,
  moduleId?: string,
  params?: { batch_id?: string; content_id?: string }
) {
  return useQuery({
    queryKey: [
      "course-module-exam",
      courseId ?? "none",
      examTypeId ?? "none",
      moduleId ?? "none",
      params?.batch_id ?? "all",
      params?.content_id ?? "latest"
    ],
    queryFn: () => getCourseModuleExam(courseId as string, examTypeId as string, moduleId as string, params),
    enabled: Boolean(courseId && examTypeId && moduleId)
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

export function useReviewableSubmissionsQuery(
  filters?: { batchId?: string; courseId?: string; userId?: string },
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: ["reviewable-submissions", filters?.batchId ?? "all", filters?.courseId ?? "all", filters?.userId ?? "all"],
    queryFn: () => getReviewableSubmissions(filters),
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

export function useUpdateModuleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, payload }: { moduleId: string; payload: Parameters<typeof updateModule>[1] }) =>
      updateModule(moduleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-modules"] });
      pushToast("Module updated successfully.", "success");
    }
  });
}

export function useDeleteModuleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["module-contents"] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-modules"] });
      pushToast("Module deleted successfully.", "success");
    }
  });
}

export function useCreateModuleSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      payload
    }: {
      moduleId: string;
      payload: Parameters<typeof createModuleSubcategory>[1];
    }) => createModuleSubcategory(moduleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      pushToast("Module subcategory created successfully.", "success");
    }
  });
}

export function useUpdateModuleSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      subcategoryId,
      payload
    }: {
      moduleId: string;
      subcategoryId: string;
      payload: Parameters<typeof updateModuleSubcategory>[2];
    }) => updateModuleSubcategory(moduleId, subcategoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      pushToast("Module subcategory updated successfully.", "success");
    }
  });
}

export function useDeleteModuleSubcategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      subcategoryId
    }: {
      moduleId: string;
      subcategoryId: string;
    }) => deleteModuleSubcategory(moduleId, subcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      pushToast("Module subcategory deleted successfully.", "success");
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
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      pushToast("Content added successfully.", "success");
    }
  });
}

export function useQuizPreviewMutation() {
  return useMutation({
    mutationFn: previewGeneratedQuiz
  });
}

export function useAddReusableContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addReusableContent,
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ["reusable-module-contents", content.module_id] });
      pushToast("Reusable content saved successfully.", "success");
    }
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
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      pushToast("Content updated successfully.", "success");
    }
  });
}

export function useUpdateReusableContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, payload }: { contentId: string; payload: Parameters<typeof updateReusableContent>[1] }) =>
      updateReusableContent(contentId, payload),
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ["reusable-module-contents", content.module_id] });
      pushToast("Reusable content updated successfully.", "success");
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
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      pushToast("Content deleted successfully.", "success");
    }
  });
}

export function useAssignReusableContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentId,
      payload
    }: {
      contentId: string;
      payload: Parameters<typeof assignReusableContentToBatch>[1];
    }) => assignReusableContentToBatch(contentId, payload),
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ["module-contents", content.batch_id, content.module_id] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      pushToast("Reusable content assigned successfully.", "success");
    }
  });
}

export function useDeleteReusableContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, moduleId }: { contentId: string; moduleId: string }) =>
      deleteReusableContent(contentId).then((result) => ({ ...result, moduleId })),
    onSuccess: ({ moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ["reusable-module-contents", moduleId] });
      pushToast("Reusable content deleted successfully.", "success");
    }
  });
}

export function useSubmitStudentContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitStudentContentResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["tecai-exam"] });
      queryClient.invalidateQueries({ queryKey: ["course-module-exam"] });
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

export function useAssignResourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      pushToast("Resource assigned successfully.", "success");
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

export function useRemoveResourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      pushToast("Resource removed successfully.", "success");
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

export function useMarkContentProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      pushToast("Content progress updated.", "success");
    }
  });
}

export function useUpdateStudentContentAccessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentId,
      payload
    }: {
      contentId: string;
      payload: Parameters<typeof updateStudentContentAccess>[1];
    }) => updateStudentContentAccess(contentId, payload),
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ["module-contents", content.batch_id, content.module_id] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      pushToast("Student content access updated.", "success");
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
      queryClient.invalidateQueries({ queryKey: ["student-modules"] });
      queryClient.invalidateQueries({ queryKey: ["student-batch-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["tecai-exam"] });
      queryClient.invalidateQueries({ queryKey: ["course-module-exam"] });
      pushToast("Submission reviewed successfully.", "success");
    }
  });
}

// User Details Management Hooks
export function useUserDetailsQuery(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["user-details", userId],
    queryFn: () => getUserDetails(userId),
    enabled: options?.enabled ?? Boolean(userId)
  });
}

export function useEnrollUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...payload }: { userId: string } & Parameters<typeof enrollUser>[1]) =>
      enrollUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User enrolled successfully.", "success");
    }
  });
}

export function useRemoveUserEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => removeUserEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User enrollment removed successfully.", "success");
    }
  });
}

export function useAssignUserToBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...payload }: { userId: string } & Parameters<typeof assignUserToBatch>[1]) =>
      assignUserToBatch(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User assigned to batch successfully.", "success");
    }
  });
}

export function useRemoveUserFromBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, batchAssignmentId }: { userId: string; batchAssignmentId: string }) =>
      removeUserFromBatch(userId, batchAssignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast("User removed from batch successfully.", "success");
    }
  });
}

export function useCreateUserContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...payload }: { userId: string } & Parameters<typeof createUserContent>[1]) =>
      createUserContent(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      pushToast("Content created successfully.", "success");
    }
  });
}

export function useUpdateUserContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, contentId, ...payload }: { userId: string; contentId: string } & Parameters<typeof updateUserContent>[2]) =>
      updateUserContent(userId, contentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      pushToast("Content updated successfully.", "success");
    }
  });
}

export function useDeleteUserContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, contentId }: { userId: string; contentId: string }) =>
      deleteUserContent(userId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      pushToast("Content deleted successfully.", "success");
    }
  });
}

export function useReviewUserSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, submissionId, ...payload }: { userId: string; submissionId: string } & Parameters<typeof reviewUserSubmission>[2]) =>
      reviewUserSubmission(userId, submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["reviewable-submissions"] });
      pushToast("Submission reviewed successfully.", "success");
    }
  });
}
