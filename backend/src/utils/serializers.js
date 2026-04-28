const { asId } = require("../services/accessService");

const serializeInstitute = (institute) => ({
  institute_id: asId(institute._id),
  name: institute.name,
  email: institute.email,
  mob_no: institute.mobNo,
  country: institute.country,
  state: institute.state,
  place: institute.place,
  pincode: institute.pincode,
  active: institute.active,
  created_at: institute.createdAt,
  updated_at: institute.updatedAt
});

const serializeUser = (user) => ({
  user_id: asId(user._id),
  institute_id: asId(user.instituteId?._id || user.instituteId),
  institute_name: user.instituteId?.name || null,
  first_name: user.firstName,
  last_name: user.lastName,
  email: user.email,
  mob_no: user.mobNo,
  is_approved: user.isApproved,
  active: user.active,
  role_names: [...new Set(user.roles || [])].sort(),
  created_at: user.createdAt
});

const serializeCourse = (course) => ({
  course_id: asId(course._id),
  institute_id: asId(course.instituteId),
  course_name: course.courseName,
  description: course.description ?? null,
  image_url: course.imageUrl ?? null,
  active: course.active
});

const serializeSubcourse = (subcourse) => ({
  subcourse_id: asId(subcourse._id),
  course_id: asId(subcourse.courseId),
  institute_id: asId(subcourse.instituteId),
  subcourse_name: subcourse.subcourseName,
  description: subcourse.description ?? null,
  image_url: subcourse.imageUrl ?? null,
  active: subcourse.active
});

const serializeModule = (module) => ({
  module_id: asId(module._id),
  course_id: asId(module.courseId),
  subcourse_id: asId(module.subcourseId),
  institute_id: asId(module.instituteId),
  module_name: module.moduleName,
  active: module.active
});

const serializeContent = (content) => ({
  content_id: asId(content._id),
  institute_id: asId(content.instituteId),
  module_id: asId(content.moduleId),
  batch_id: asId(content.batchId),
  created_by: asId(content.createdBy),
  title: content.title,
  type: content.type,
  description: content.description ?? null,
  file_url: content.fileUrl ?? null,
  external_url: content.externalUrl ?? null,
  resolved_url: content.fileUrl || content.externalUrl || null,
  order_index: content.orderIndex ?? 0,
  category: content.profile?.category ?? "reading",
  body_text: content.description ?? null,
  instructions: content.profile?.instructions ?? null,
  downloadable: Boolean(content.profile?.downloadable),
  response_type: content.profile?.responseType ?? null,
  url: content.fileUrl || content.externalUrl || null,
  duration: content.duration ?? 0,
  created_at: content.createdAt,
  updated_at: content.updatedAt ?? null
});

const serializeBatch = (batch) => ({
  batch_id: asId(batch._id),
  institute_id: asId(batch.instituteId),
  course_id: asId(batch.courseId),
  subcourse_id: asId(batch.subcourseId),
  batch_name: batch.batchName,
  active: batch.active,
  detail: batch.detail
    ? {
        description: batch.detail.description ?? null,
        room_name: batch.detail.roomName ?? null,
        schedule_notes: batch.detail.scheduleNotes ?? null,
        start_date: batch.detail.startDate ?? null,
        end_date: batch.detail.endDate ?? null
      }
    : null
});

const serializeUserCourse = (row) => ({
  id: asId(row._id),
  institute_id: asId(row.instituteId),
  user_id: asId(row.userId),
  course_id: asId(row.courseId),
  subcourse_id: asId(row.subcourseId)
});

const serializeUserBatch = (row) => ({
  user_batch_id: asId(row._id),
  institute_id: asId(row.instituteId),
  user_id: asId(row.userId),
  batch_id: asId(row.batchId),
  active: row.active
});

const serializeBatchTeacher = (row) => ({
  id: asId(row._id),
  institute_id: asId(row.instituteId),
  batch_id: asId(row.batchId),
  user_id: asId(row.userId)
});

const serializeStudentSubmission = (submission) => ({
  submission_id: asId(submission._id),
  response_type: submission.responseType,
  response_text: submission.responseText ?? null,
  response_url: submission.responseUrl ?? null,
  submitted_at: submission.submittedAt
});

const serializeProgress = (progress) => ({
  id: asId(progress._id),
  institute_id: asId(progress.instituteId),
  user_id: asId(progress.userId),
  module_id: asId(progress.moduleId),
  completed: progress.completed,
  progress_percent: progress.progressPercent,
  last_accessed: progress.lastAccessed
});

module.exports = {
  serializeInstitute,
  serializeUser,
  serializeCourse,
  serializeSubcourse,
  serializeModule,
  serializeContent,
  serializeBatch,
  serializeUserCourse,
  serializeUserBatch,
  serializeBatchTeacher,
  serializeStudentSubmission,
  serializeProgress
};
