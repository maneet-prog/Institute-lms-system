const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Subcourse = require("../models/Subcourse");
const User = require("../models/User");
const { BatchTeacher, UserBatch, UserCourse } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const {
  hasRole,
  resolveInstituteScope,
  getTeacherScope,
  getStudentBatchScope,
  sameId
} = require("./accessService");
const {
  serializeBatch,
  serializeBatchTeacher,
  serializeUser,
  serializeUserBatch
} = require("../utils/serializers");

const findCourse = (courseId, instituteId) => Course.findOne({ _id: courseId, instituteId });
const findSubcourse = (subcourseId, instituteId) => Subcourse.findOne({ _id: subcourseId, instituteId });

const findBatchOrThrow = async (batchId, instituteId) => {
  const batch = await Batch.findOne({ _id: batchId, instituteId });
  if (!batch) throw new AppError("Batch not found.", 404);
  return batch;
};

const validateCoursePath = async ({ instituteId, courseId, subcourseId }) => {
  const course = await findCourse(courseId, instituteId);
  const subcourse = await findSubcourse(subcourseId, instituteId);
  if (!course || !subcourse || !sameId(subcourse.courseId, courseId)) {
    throw new AppError("Course or subcourse not found for this institute.", 404);
  }
  return { course, subcourse };
};

const syncStudentCourseEnrollment = async (userId, instituteId, batch) => {
  const existing = await UserCourse.findOne({
    userId,
    instituteId,
    courseId: batch.courseId,
    subcourseId: batch.subcourseId
  });

  if (!existing) {
    await UserCourse.create({
      instituteId,
      userId,
      courseId: batch.courseId,
      subcourseId: batch.subcourseId
    });
  }
};

const cleanupStudentCourseEnrollment = async (userId, instituteId, batch) => {
  const remainingAssignments = await UserBatch.find({ userId, instituteId, active: true }).populate("batchId");
  const stillHasSamePath = remainingAssignments.some(
    (row) =>
      row.batchId &&
      sameId(row.batchId.courseId, batch.courseId) &&
      sameId(row.batchId.subcourseId, batch.subcourseId)
  );

  if (!stillHasSamePath) {
    await UserCourse.deleteMany({
      userId,
      instituteId,
      courseId: batch.courseId,
      subcourseId: batch.subcourseId
    });
  }
};

const createBatch = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  await validateCoursePath({
    instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id
  });

  const batch = await Batch.create({
    instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    batchName: payload.batch_name,
    active: payload.active,
    detail: {
      description: payload.description,
      roomName: payload.room_name,
      scheduleNotes: payload.schedule_notes,
      startDate: payload.start_date,
      endDate: payload.end_date
    }
  });
  return serializeBatch(batch);
};

const updateBatch = async (id, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const batch = await findBatchOrThrow(id, instituteId);

  await validateCoursePath({
    instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id
  });

  batch.courseId = payload.course_id;
  batch.subcourseId = payload.subcourse_id;
  batch.batchName = payload.batch_name;
  batch.active = payload.active;
  batch.detail = {
    description: payload.description,
    roomName: payload.room_name,
    scheduleNotes: payload.schedule_notes,
    startDate: payload.start_date,
    endDate: payload.end_date
  };
  await batch.save();
  return serializeBatch(batch);
};

const listBatches = async ({ tenant, currentUser, instituteId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(hasRole(currentUser, "super_admin") ? {} : { active: true })
  };
  const batches = await Batch.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return batches
      .filter((batch) => teacherScope.batchIds.has(String(batch._id)))
      .map(serializeBatch);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentBatchScope(currentUser._id, scopedInstituteId);
    return batches
      .filter((batch) => studentScope.batchIds.has(String(batch._id)))
      .map(serializeBatch);
  }

  return batches.map(serializeBatch);
};

const getBatchDetail = async (batchId, tenant, currentUser, instituteId) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });
  const batch = await findBatchOrThrow(batchId, scopedInstituteId);

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    if (!teacherScope.batchIds.has(String(batch._id))) {
      throw new AppError("Batch access denied.", 403);
    }
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentBatchScope(currentUser._id, scopedInstituteId);
    if (!studentScope.batchIds.has(String(batch._id))) {
      throw new AppError("Batch access denied.", 403);
    }
  }

  const course = await Course.findById(batch.courseId);
  const subcourse = await Subcourse.findById(batch.subcourseId);
  const teacherRows = await BatchTeacher.find({
    batchId: batch._id,
    instituteId: scopedInstituteId
  });
  const studentRows = await UserBatch.find({
    batchId: batch._id,
    instituteId: scopedInstituteId,
    active: true
  });

  const teacherIds = teacherRows.map((row) => row.userId);
  const studentIds = studentRows.map((row) => row.userId);
  const teachers = await User.find({ _id: { $in: teacherIds }, active: true }).populate("instituteId");
  const students = await User.find({ _id: { $in: studentIds }, active: true }).populate("instituteId");

  return {
    batch_id: String(batch._id),
    batch_name: batch.batchName,
    active: batch.active,
    description: batch.detail?.description ?? null,
    room_name: batch.detail?.roomName ?? null,
    schedule_notes: batch.detail?.scheduleNotes ?? null,
    start_date: batch.detail?.startDate ?? null,
    end_date: batch.detail?.endDate ?? null,
    course: {
      course_id: String(course?._id || batch.courseId),
      course_name: course?.courseName || String(batch.courseId)
    },
    subcourse: {
      subcourse_id: String(subcourse?._id || batch.subcourseId),
      subcourse_name: subcourse?.subcourseName || String(batch.subcourseId)
    },
    teachers: teachers.map(serializeUser),
    students: students.map(serializeUser)
  };
};

const deleteBatch = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const batch = await findBatchOrThrow(id, instituteId);
  batch.active = false;
  await batch.save();
};

const assignTeacher = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  await findBatchOrThrow(payload.batch_id, instituteId);

  const teacher = await User.findById(payload.user_id);
  if (!teacher || !sameId(teacher.instituteId, instituteId) || !teacher.roles.includes("teacher")) {
    throw new AppError("Teacher not found.", 404);
  }

  const existing = await BatchTeacher.findOne({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  if (existing) throw new AppError("Teacher already assigned to batch.", 409);

  const row = await BatchTeacher.create({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  return serializeBatchTeacher(row);
};

const removeTeacher = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const removed = await BatchTeacher.findOneAndDelete({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  if (!removed) throw new AppError("Teacher assignment not found.", 404);
};

const assignUserToBatch = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const batch = await findBatchOrThrow(payload.batch_id, instituteId);

  const user = await User.findById(payload.user_id);
  if (!user || !sameId(user.instituteId, instituteId) || !user.roles.includes("student")) {
    throw new AppError("Student not found.", 404);
  }

  const existing = await UserBatch.findOne({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      await existing.save();
      await syncStudentCourseEnrollment(user._id, instituteId, batch);
      return serializeUserBatch(existing);
    }
    throw new AppError("User already assigned to batch.", 409);
  }

  const row = await UserBatch.create({
    instituteId,
    userId: payload.user_id,
    batchId: payload.batch_id,
    active: true
  });
  await syncStudentCourseEnrollment(user._id, instituteId, batch);
  return serializeUserBatch(row);
};

const removeUserFromBatch = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const batch = await findBatchOrThrow(payload.batch_id, instituteId);
  const row = await UserBatch.findOne({
    instituteId,
    batchId: payload.batch_id,
    userId: payload.user_id
  });
  if (!row || !row.active) throw new AppError("Student batch assignment not found.", 404);

  row.active = false;
  await row.save();
  await cleanupStudentCourseEnrollment(payload.user_id, instituteId, batch);
};

module.exports = {
  createBatch,
  updateBatch,
  listBatches,
  getBatchDetail,
  deleteBatch,
  assignTeacher,
  removeTeacher,
  assignUserToBatch,
  removeUserFromBatch
};
