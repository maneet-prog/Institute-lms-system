const bcrypt = require("bcryptjs");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Institute = require("../models/Institute");
const Subcourse = require("../models/Subcourse");
const User = require("../models/User");
const {
  BatchTeacher,
  UserBatch,
  UserCourse,
  UserSelectedCourse
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
  await UserCourse.deleteMany({ userId, instituteId });
  await BatchTeacher.deleteMany({ userId, instituteId });
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

  await UserSelectedCourse.deleteMany({ userId: user._id });

  if (normalizedCourseId && normalizedSubcourseId && !batch) {
    await UserSelectedCourse.create({
      userId: user._id,
      courseId: normalizedCourseId,
      subcourseId: normalizedSubcourseId
    });
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

  const query = hasRole(currentUser, "super_admin")
    ? { instituteId: scopedInstituteId }
    : { instituteId: scopedInstituteId, active: true };

  const users = await User.find(query).populate("instituteId").sort({ createdAt: -1 });
  return enrichUsers(users);
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
  createUser,
  updateUser,
  approveUser,
  assignUserInstitute,
  assignRoles,
  deleteUser,
  updateProfile
};
