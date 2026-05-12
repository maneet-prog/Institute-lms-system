const bcrypt = require("bcryptjs");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Institute = require("../models/Institute");
const Subcourse = require("../models/Subcourse");
const User = require("../models/User");
const Content = require("../models/Content");
const StudentSubmission = require("../models/StudentSubmission");
const UserProgress = require("../models/Progress");
const {
  BatchTeacher,
  UserBatch,
  UserCourse,
  UserSelectedCourse,
  UserModule
} = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { hasRole, resolveInstituteScope, sameId } = require("./accessService");
const { serializeUser } = require("../utils/serializers");
const batchService = require("./batchService");

const getScopedUser = async (id, tenant, currentUser) => {
  const user = await User.findById(id).populate("instituteId");
  if (!user) throw new AppError("User not found.", 404);
  if (!hasRole(currentUser, "super_admin") && !sameId(user.instituteId?._id || user.instituteId, tenant.instituteId)) {
    throw new AppError("User not found.", 404);
  }
  return user;
};

const validateCoursePath = async (courseId, subcourseId, instituteId) => {
  if (!courseId && !subcourseId) return null;
  if (!(courseId && subcourseId)) {
    throw new AppError("Course and subcourse must be provided together.", 400);
  }

  const course = await Course.findOne({ _id: courseId, instituteId });
  const subcourse = await Subcourse.findOne({ _id: subcourseId, instituteId });
  if (!course || !subcourse || !sameId(subcourse.courseId, course._id)) {
    throw new AppError("Course/subcourse not found.", 404);
  }
  return { course, subcourse };
};

const validateBatchAgainstSelection = async (batchId, instituteId, courseId, subcourseId) => {
  if (!batchId) return null;
  const batch = await Batch.findOne({ _id: batchId, instituteId, active: true });
  if (!batch) throw new AppError("Batch not found.", 404);

  if (courseId && !sameId(batch.courseId, courseId)) {
    throw new AppError("Selected batch does not belong to the selected course.", 400);
  }
  if (subcourseId && !sameId(batch.subcourseId, subcourseId)) {
    throw new AppError("Selected batch does not belong to the selected subcourse.", 400);
  }

  return batch;
};

const enrichUsers = async (users) => {
  const userIds = users.map((user) => user._id);
  const selectedCourses = await UserSelectedCourse.find({ userId: { $in: userIds } })
    .populate("courseId subcourseId")
    .lean();
  const batchAssignments = await UserBatch.find({
    userId: { $in: userIds },
    active: true
  })
    .populate({
      path: "batchId",
      populate: [{ path: "courseId" }, { path: "subcourseId" }]
    })
    .lean();

  const selectedByUser = new Map();
  for (const row of selectedCourses) {
    const key = String(row.userId);
    const list = selectedByUser.get(key) || [];
    list.push({
      course_id: row.courseId ? String(row.courseId._id || row.courseId) : String(row.courseId),
      course_name: row.courseId?.courseName ?? null,
      subcourse_id: row.subcourseId ? String(row.subcourseId._id || row.subcourseId) : String(row.subcourseId),
      subcourse_name: row.subcourseId?.subcourseName ?? null
    });
    selectedByUser.set(key, list);
  }

  const batchesByUser = new Map();
  for (const row of batchAssignments) {
    if (!row.batchId) continue;
    const key = String(row.userId);
    const list = batchesByUser.get(key) || [];
    list.push({
      batch_id: String(row.batchId._id || row.batchId),
      batch_name: row.batchId.batchName ?? null,
      course_id: String(row.batchId.courseId?._id || row.batchId.courseId),
      course_name: row.batchId.courseId?.courseName ?? null,
      subcourse_id: String(row.batchId.subcourseId?._id || row.batchId.subcourseId),
      subcourse_name: row.batchId.subcourseId?.subcourseName ?? null
    });
    batchesByUser.set(key, list);
  }

  return users.map((user) => ({
    ...serializeUser(user),
    selected_courses: selectedByUser.get(String(user._id)) || [],
    assigned_batches: batchesByUser.get(String(user._id)) || []
  }));
};

const clearUserAssignments = async (userId, instituteId) => {
  await UserBatch.updateMany({ userId, instituteId, active: true }, { active: false });
  await UserCourse.updateMany({ userId, instituteId }, { active: false });
  await BatchTeacher.updateMany({ userId, instituteId }, { active: false });
};

const applyUserAssignments = async ({ user, instituteId, courseId, subcourseId, batchId, currentUser, tenant }) => {
  if (courseId === undefined && subcourseId === undefined && batchId === undefined) {
    return;
  }

  const normalizedCourseId = courseId || null;
  const normalizedSubcourseId = subcourseId || null;
  const normalizedBatchId = batchId || null;
  const roles = user.roles || [];
  const primaryRole = roles.includes("teacher") ? "teacher" : roles.includes("student") ? "student" : null;

  await validateCoursePath(normalizedCourseId, normalizedSubcourseId, instituteId);
  const batch = await validateBatchAgainstSelection(
    normalizedBatchId,
    instituteId,
    normalizedCourseId,
    normalizedSubcourseId
  );

  await UserSelectedCourse.updateMany({ userId: user._id }, { active: false });

  if (normalizedCourseId && normalizedSubcourseId && !batch) {
    const existing = await UserSelectedCourse.findOne({
      userId: user._id,
      courseId: normalizedCourseId,
      subcourseId: normalizedSubcourseId
    });
    if (existing) {
      existing.active = true;
      await existing.save();
    } else {
      await UserSelectedCourse.create({
        userId: user._id,
        courseId: normalizedCourseId,
        subcourseId: normalizedSubcourseId
      });
    }
  }

  await clearUserAssignments(user._id, instituteId);

  if (!batch || !primaryRole) {
    return;
  }

  if (primaryRole === "teacher") {
    await batchService.assignTeacher(
      {
        batch_id: String(batch._id),
        user_id: String(user._id),
        institute_id: String(instituteId)
      },
      tenant,
      currentUser
    );
    return;
  }

  await batchService.assignUserToBatch(
    {
      batch_id: String(batch._id),
      user_id: String(user._id),
      institute_id: String(instituteId)
    },
    tenant,
    currentUser
  );
};

const listUsers = async ({ instituteId, tenant, currentUser }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = hasRole(currentUser, "super_admin", "institute_admin")
    ? { instituteId: scopedInstituteId }
    : { instituteId: scopedInstituteId, active: true };

  const users = await User.find(query).populate("instituteId").sort({ createdAt: -1 });
  return enrichUsers(users);
};

const getUserDetails = async (userId, tenant, currentUser) => {
  const user = await getScopedUser(userId, tenant, currentUser);
  await user.populate("instituteId");

  const instituteId = user.instituteId?._id || user.instituteId;

  // Get user's courses and enrollments
  const userCourses = await UserCourse.find({ userId, instituteId, active: true })
    .populate("courseId subcourseId")
    .lean();

  const userSelectedCourses = await UserSelectedCourse.find({ userId, active: true })
    .populate("courseId subcourseId")
    .lean();

  // Get user's batch assignments
  const userBatches = await UserBatch.find({ userId, instituteId, active: true })
    .populate({
      path: "batchId",
      populate: [{ path: "courseId" }, { path: "subcourseId" }]
    })
    .lean();

  // Get user's module enrollments
  const userModules = await UserModule.find({ userId, instituteId, active: true })
    .populate({
      path: "moduleId",
      populate: [{ path: "courseId" }, { path: "subcourseId" }]
    })
    .lean();

  // Get user's progress
  const userProgress = await UserProgress.find({ userId, instituteId })
    .populate({
      path: "moduleId",
      populate: [{ path: "courseId" }, { path: "subcourseId" }]
    })
    .lean();

  // Get user's content (if teacher, content they created; if student, content assigned to them)
  let userContent = [];
  if (user.roles.includes("teacher")) {
    userContent = await Content.find({ createdBy: userId, instituteId, active: true })
      .populate("moduleId batchId")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    // For students, get content assigned to their batches or directly assigned
    const batchIds = userBatches.map(ub => ub.batchId?._id).filter(Boolean);
    userContent = await Content.find({
      instituteId,
      active: true,
      $or: [
        { batchId: { $in: batchIds } },
        { assignedStudentIds: userId },
        { visibilityScope: "batch", batchId: { $in: batchIds } }
      ]
    })
      .populate("moduleId batchId createdBy")
      .sort({ createdAt: -1 })
      .lean();
  }

  // Get user's submissions
  const userSubmissions = await StudentSubmission.find({ userId, instituteId })
    .populate({
      path: "moduleId",
      populate: [{ path: "courseId" }, { path: "subcourseId" }]
    })
    .populate("reviewedBy")
    .sort({ createdAt: -1 })
    .lean();

  // Get teaching assignments (if teacher)
  const teachingAssignments = await BatchTeacher.find({ userId, instituteId, active: true })
    .populate({
      path: "batchId",
      populate: [{ path: "courseId" }, { path: "subcourseId" }]
    })
    .lean();

  return {
    user: serializeUser(user),
    courses: {
      enrolled: userCourses.map(uc => ({
        id: String(uc._id),
        course_id: String(uc.courseId?._id || uc.courseId),
        course_name: uc.courseId?.courseName,
        subcourse_id: String(uc.subcourseId?._id || uc.subcourseId),
        subcourse_name: uc.subcourseId?.subcourseName,
        enrolled_at: uc.createdAt
      })),
      selected: userSelectedCourses.map(usc => ({
        course_id: String(usc.courseId?._id || usc.courseId),
        course_name: usc.courseId?.courseName,
        subcourse_id: String(usc.subcourseId?._id || usc.subcourseId),
        subcourse_name: usc.subcourseId?.subcourseName
      }))
    },
    batches: {
      assigned: userBatches.map(ub => ({
        id: String(ub._id),
        batch_id: String(ub.batchId?._id || ub.batchId),
        batch_name: ub.batchId?.batchName,
        course_id: String(ub.batchId?.courseId?._id || ub.batchId?.courseId),
        course_name: ub.batchId?.courseId?.courseName,
        subcourse_id: String(ub.batchId?.subcourseId?._id || ub.batchId?.subcourseId),
        subcourse_name: ub.batchId?.subcourseId?.subcourseName,
        assigned_at: ub.createdAt
      })),
      teaching: teachingAssignments.map(ta => ({
        id: String(ta._id),
        batch_id: String(ta.batchId?._id || ta.batchId),
        batch_name: ta.batchId?.batchName,
        course_id: String(ta.batchId?.courseId?._id || ta.batchId?.courseId),
        course_name: ta.batchId?.courseId?.courseName,
        subcourse_id: String(ta.batchId?.subcourseId?._id || ta.batchId?.subcourseId),
        subcourse_name: ta.batchId?.subcourseId?.subcourseName,
        assigned_at: ta.createdAt
      }))
    },
    modules: userModules.map(um => ({
      id: String(um._id),
      module_id: String(um.moduleId?._id || um.moduleId),
      module_name: um.moduleId?.moduleName,
      exam_type: um.moduleId?.examType,
      course_id: String(um.moduleId?.courseId?._id || um.moduleId?.courseId),
      course_name: um.moduleId?.courseId?.courseName,
      subcourse_id: String(um.moduleId?.subcourseId?._id || um.moduleId?.subcourseId),
      subcourse_name: um.moduleId?.subcourseId?.subcourseName,
      enrolled_at: um.createdAt
    })),
    progress: userProgress.map(up => ({
      id: String(up._id),
      module_id: String(up.moduleId?._id || up.moduleId),
      module_name: up.moduleId?.moduleName,
      completed: up.completed,
      progress_percent: up.progressPercent,
      last_accessed: up.lastAccessed,
      course_id: String(up.moduleId?.courseId?._id || up.moduleId?.courseId),
      course_name: up.moduleId?.courseId?.courseName,
      subcourse_id: String(up.moduleId?.subcourseId?._id || up.moduleId?.subcourseId),
      subcourse_name: up.moduleId?.subcourseId?.subcourseName
    })),
    content: userContent.map(content => ({
      id: String(content._id),
      title: content.title,
      type: content.type,
      description: content.description,
      file_url: content.fileUrl,
      external_url: content.externalUrl,
      order_index: content.orderIndex,
      duration: content.duration,
      visibility_scope: content.visibilityScope,
      created_at: content.createdAt,
      module_id: String(content.moduleId?._id || content.moduleId),
      module_name: content.moduleId?.moduleName,
      batch_id: content.batchId ? String(content.batchId?._id || content.batchId) : null,
      batch_name: content.batchId?.batchName,
      created_by: content.createdBy ? String(content.createdBy) : null
    })),
    submissions: userSubmissions.map(sub => ({
      id: String(sub._id),
      module_id: String(sub.moduleId?._id || sub.moduleId),
      module_name: sub.moduleId?.moduleName,
      exam_id: sub.examId ? String(sub.examId) : null,
      status: sub.status,
      attempts_count: sub.attempts?.length || 0,
      latest_attempt: sub.attempts?.length > 0 ? {
        attempt_number: sub.attempts[sub.attempts.length - 1].attemptNumber,
        submitted_at: sub.attempts[sub.attempts.length - 1].submittedAt,
        auto_score: sub.attempts[sub.attempts.length - 1].autoScore,
        awarded_marks: sub.attempts[sub.attempts.length - 1].awardedMarks,
        max_score: sub.attempts[sub.attempts.length - 1].maxScore,
        status: sub.attempts[sub.attempts.length - 1].status,
        feedback: sub.attempts[sub.attempts.length - 1].feedback,
        reviewed_at: sub.attempts[sub.attempts.length - 1].reviewedAt,
        reviewed_by: sub.attempts[sub.attempts.length - 1].reviewedBy ? String(sub.attempts[sub.attempts.length - 1].reviewedBy) : null
      } : null,
      course_id: String(sub.moduleId?.courseId?._id || sub.moduleId?.courseId),
      course_name: sub.moduleId?.courseId?.courseName,
      subcourse_id: String(sub.moduleId?.subcourseId?._id || sub.moduleId?.subcourseId),
      subcourse_name: sub.moduleId?.subcourseId?.subcourseName,
      created_at: sub.createdAt
    }))
  };
};

const enrollUser = async (userId, payload, tenant, currentUser) => {
  const user = await getScopedUser(userId, tenant, currentUser);
  const instituteId = user.instituteId?._id || user.instituteId;

  const { courseId, subcourseId } = await validateCoursePath(payload.course_id, payload.subcourse_id, instituteId);

  // Check if already enrolled
  const existing = await UserCourse.findOne({
    userId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    instituteId,
    active: true
  });

  if (existing) {
    throw new AppError("User is already enrolled in this course/subcourse.", 409);
  }

  const enrollment = await UserCourse.create({
    userId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    instituteId,
    active: true
  });

  return {
    id: String(enrollment._id),
    user_id: String(userId),
    course_id: String(payload.course_id),
    course_name: courseId.courseName,
    subcourse_id: String(payload.subcourse_id),
    subcourse_name: subcourseId.subcourseName,
    enrolled_at: enrollment.createdAt
  };
};

const removeUserEnrollment = async (enrollmentId, tenant, currentUser) => {
  const enrollment = await UserCourse.findById(enrollmentId);
  if (!enrollment) throw new AppError("Enrollment not found.", 404);

  if (!hasRole(currentUser, "super_admin") && !sameId(enrollment.instituteId, tenant.instituteId)) {
    throw new AppError("Enrollment not found.", 404);
  }

  enrollment.active = false;
  await enrollment.save();
};

const assignUserToBatch = async (userId, payload, tenant, currentUser) => {
  const user = await getScopedUser(userId, tenant, currentUser);
  const instituteId = user.instituteId?._id || user.instituteId;

  const batch = await validateBatchAgainstSelection(payload.batch_id, instituteId);

  // Check if already assigned
  const existing = await UserBatch.findOne({
    userId,
    batchId: payload.batch_id,
    instituteId,
    active: true
  });

  if (existing) {
    throw new AppError("User is already assigned to this batch.", 409);
  }

  const assignment = await UserBatch.create({
    userId,
    batchId: payload.batch_id,
    instituteId,
    active: true
  });

  return {
    id: String(assignment._id),
    user_id: String(userId),
    batch_id: String(payload.batch_id),
    batch_name: batch.batchName,
    course_id: String(batch.courseId),
    course_name: batch.courseId?.courseName,
    subcourse_id: String(batch.subcourseId),
    subcourse_name: batch.subcourseId?.subcourseName,
    assigned_at: assignment.createdAt
  };
};

const removeUserFromBatch = async (batchAssignmentId, tenant, currentUser) => {
  const assignment = await UserBatch.findById(batchAssignmentId);
  if (!assignment) throw new AppError("Batch assignment not found.", 404);

  if (!hasRole(currentUser, "super_admin") && !sameId(assignment.instituteId, tenant.instituteId)) {
    throw new AppError("Batch assignment not found.", 404);
  }

  assignment.active = false;
  await assignment.save();
};

const createUserContent = async (userId, payload, tenant, currentUser) => {
  const user = await getScopedUser(userId, tenant, currentUser);
  const instituteId = user.instituteId?._id || user.instituteId;

  // Verify the user is a teacher
  if (!user.roles.includes("teacher")) {
    throw new AppError("Only teachers can create content.", 403);
  }

  // Verify batch and module exist
  const batch = await Batch.findOne({ _id: payload.batch_id, instituteId, active: true });
  if (!batch) throw new AppError("Batch not found.", 404);

  const module = await require("../models/Module").findOne({ _id: payload.module_id, instituteId, active: true });
  if (!module) throw new AppError("Module not found.", 404);

  const content = await Content.create({
    instituteId,
    moduleId: payload.module_id,
    batchId: payload.batch_id,
    createdBy: userId,
    title: payload.title,
    type: payload.type,
    description: payload.description,
    externalUrl: payload.external_url,
    orderIndex: payload.order_index || 0,
    duration: payload.duration || 0,
    visibilityScope: payload.visibility_scope || "batch",
    assignedStudentIds: payload.assigned_student_ids || [],
    profile: {
      category: payload.category || "reading",
      instructions: payload.instructions,
      responseType: payload.response_type
    },
    active: true
  });

  return {
    id: String(content._id),
    title: content.title,
    type: content.type,
    description: content.description,
    external_url: content.externalUrl,
    order_index: content.orderIndex,
    duration: content.duration,
    visibility_scope: content.visibilityScope,
    created_at: content.createdAt,
    module_id: String(payload.module_id),
    batch_id: String(payload.batch_id),
    created_by: String(userId)
  };
};

const updateUserContent = async (contentId, payload, tenant, currentUser) => {
  const content = await Content.findById(contentId);
  if (!content) throw new AppError("Content not found.", 404);

  if (!hasRole(currentUser, "super_admin") && !sameId(content.instituteId, tenant.instituteId)) {
    throw new AppError("Content not found.", 404);
  }

  // Update allowed fields
  if (payload.title !== undefined) content.title = payload.title;
  if (payload.description !== undefined) content.description = payload.description;
  if (payload.external_url !== undefined) content.externalUrl = payload.external_url;
  if (payload.order_index !== undefined) content.orderIndex = payload.order_index;
  if (payload.duration !== undefined) content.duration = payload.duration;
  if (payload.visibility_scope !== undefined) content.visibilityScope = payload.visibility_scope;
  if (payload.assigned_student_ids !== undefined) content.assignedStudentIds = payload.assigned_student_ids;

  await content.save();

  return {
    id: String(content._id),
    title: content.title,
    type: content.type,
    description: content.description,
    external_url: content.externalUrl,
    order_index: content.orderIndex,
    duration: content.duration,
    visibility_scope: content.visibilityScope,
    updated_at: content.updatedAt
  };
};

const deleteUserContent = async (contentId, tenant, currentUser) => {
  const content = await Content.findById(contentId);
  if (!content) throw new AppError("Content not found.", 404);

  if (!hasRole(currentUser, "super_admin") && !sameId(content.instituteId, tenant.instituteId)) {
    throw new AppError("Content not found.", 404);
  }

  content.active = false;
  await content.save();
};

const reviewUserSubmission = async (submissionId, payload, tenant, currentUser) => {
  const submission = await StudentSubmission.findById(submissionId);
  if (!submission) throw new AppError("Submission not found.", 404);

  if (!hasRole(currentUser, "super_admin") && !sameId(submission.instituteId, tenant.instituteId)) {
    throw new AppError("Submission not found.", 404);
  }

  // Find the latest attempt
  const latestAttempt = submission.attempts[submission.attempts.length - 1];
  if (!latestAttempt) throw new AppError("No attempts found in submission.", 400);

  latestAttempt.awardedMarks = payload.awarded_marks;
  latestAttempt.feedback = payload.feedback;
  latestAttempt.status = "reviewed";
  latestAttempt.reviewedAt = new Date();
  latestAttempt.reviewedBy = currentUser._id;

  await submission.save();

  return {
    id: String(submission._id),
    attempt_number: latestAttempt.attemptNumber,
    awarded_marks: latestAttempt.awardedMarks,
    feedback: latestAttempt.feedback,
    status: latestAttempt.status,
    reviewed_at: latestAttempt.reviewedAt,
    reviewed_by: String(currentUser._id)
  };
};

const createUser = async (payload, tenant, currentUser) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) throw new AppError("Email already registered.", 409);

  const scopedInstituteId =
    hasRole(currentUser, "super_admin") && payload.institute_id
      ? await resolveInstituteScope({
          requestedInstituteId: payload.institute_id,
          tenant,
          currentUser
        })
      : tenant.instituteId;

  const institute = await Institute.findById(scopedInstituteId);
  if (!institute) throw new AppError("Institute not found.", 404);

  const hash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    instituteId: scopedInstituteId,
    firstName: payload.first_name,
    lastName: payload.last_name,
    email: payload.email.toLowerCase(),
    mobNo: payload.mob_no,
    passwordHash: hash,
    roles: payload.role_names || ["student"],
    active: payload.active,
    isApproved: payload.is_approved
  });

  await applyUserAssignments({
    user,
    instituteId: scopedInstituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    batchId: payload.batch_id,
    currentUser,
    tenant: {
      ...tenant,
      instituteId: scopedInstituteId
    }
  });

  await user.populate("instituteId");
  return {
    ...(await enrichUsers([user]))[0]
  };
};

const updateUser = async (id, payload, tenant, currentUser) => {
  const user = await getScopedUser(id, tenant, currentUser);
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser && !sameId(existingUser._id, user._id)) {
    throw new AppError("Email already registered.", 409);
  }

  user.firstName = payload.first_name;
  user.lastName = payload.last_name;
  user.email = payload.email.toLowerCase();
  user.mobNo = payload.mob_no;
  user.active = payload.active;
  user.isApproved = payload.is_approved;
  if (payload.role_names) {
    user.roles = [...new Set(payload.role_names)];
  }

  await user.save();
  await applyUserAssignments({
    user,
    instituteId: user.instituteId?._id || user.instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    batchId: payload.batch_id,
    currentUser,
    tenant
  });

  await user.populate("instituteId");
  return {
    ...(await enrichUsers([user]))[0]
  };
};

const approveUser = async (id, payload, tenant, currentUser) => {
  const user = await User.findById(id).populate("instituteId");
  if (
    !user ||
    (!hasRole(currentUser, "super_admin") &&
      !sameId(user.instituteId?._id || user.instituteId, tenant.instituteId))
  ) {
    throw new AppError("User not found.", 404);
  }

  user.isApproved = Boolean(payload.approve);
  if (payload.approve) {
    const instituteId = user.instituteId?._id || user.instituteId;
    const selectedCourses = await UserSelectedCourse.find({ userId: user._id }).lean();
    const selectedCourse = selectedCourses[0] || null;
    const courseId = payload.course_id || selectedCourse?.courseId?.toString() || null;
    const subcourseId = payload.subcourse_id || selectedCourse?.subcourseId?.toString() || null;

    if (user.roles.includes("student") && !payload.batch_id) {
      throw new AppError("A batch must be assigned before approving this student.", 400);
    }

    await applyUserAssignments({
      user,
      instituteId,
      courseId,
      subcourseId,
      batchId: payload.batch_id,
      currentUser,
      tenant
    });
  }

  await user.save();
  await user.populate("instituteId");
  return {
    ...(await enrichUsers([user]))[0]
  };
};

const assignUserInstitute = async (id, instituteId) => {
  const user = await User.findById(id).populate("instituteId");
  if (!user) throw new AppError("User not found.", 404);

  const institute = await Institute.findById(instituteId);
  if (!institute) throw new AppError("Institute not found.", 404);

  user.instituteId = institute._id;
  await user.save();
  await user.populate("instituteId");
  return serializeUser(user);
};

const assignRoles = async (id, roleNames, tenant, currentUser) => {
  const user = await getScopedUser(id, tenant, currentUser);
  user.roles = [...new Set([...(user.roles || []), ...roleNames])];
  await user.save();
  return [...user.roles].sort();
};

const deleteUser = async (id, tenant, currentUser) => {
  const user = await getScopedUser(id, tenant, currentUser);
  user.active = false;
  await user.save();
};

const updateProfile = async (currentUser, payload) => {
  const user = await User.findById(currentUser._id).select("+passwordHash").populate("instituteId");
  if (!user) throw new AppError("User not found.", 404);

  const passwordOk = await bcrypt.compare(payload.current_password, user.passwordHash);
  if (!passwordOk) throw new AppError("Current password is incorrect.", 401);

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser && !sameId(existingUser._id, user._id)) {
    throw new AppError("Email already registered.", 409);
  }

  user.email = payload.email.toLowerCase();
  if (payload.new_password) {
    user.passwordHash = await bcrypt.hash(payload.new_password, 12);
  }

  await user.save();
  return serializeUser(user);
};

module.exports = {
  listUsers,
  getUserDetails,
  enrollUser,
  removeUserEnrollment,
  assignUserToBatch,
  removeUserFromBatch,
  createUserContent,
  updateUserContent,
  deleteUserContent,
  reviewUserSubmission,
  createUser,
  updateUser,
  approveUser,
  assignUserInstitute,
  assignRoles,
  deleteUser,
  updateProfile
};
