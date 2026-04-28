const bcrypt = require("bcryptjs");
const Course = require("../models/Course");
const Subcourse = require("../models/Subcourse");
const SystemSetting = require("../models/SystemSetting");
const User = require("../models/User");
const { UserSelectedCourse } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/token");
const { serializeUser } = require("../utils/serializers");

const register = async (payload) => {
  const exists = await User.findOne({ email: payload.email.toLowerCase() });
  if (exists) throw new AppError("Email already registered.", 409);

  const settings = await SystemSetting.findOne().lean();
  if (!settings?.defaultInstituteId) {
    throw new AppError("System settings/default institute not configured.", 500);
  }

  const hasCourseSelection = Boolean(payload.course_id || payload.subcourse_id);
  if (hasCourseSelection && !(payload.course_id && payload.subcourse_id)) {
    throw new AppError("Both course and subcourse are required together.", 400);
  }

  let course = null;
  let subcourse = null;
  if (payload.course_id && payload.subcourse_id) {
    course = await Course.findOne({
      _id: payload.course_id,
      instituteId: settings.defaultInstituteId
    });
    subcourse = await Subcourse.findOne({
      _id: payload.subcourse_id,
      instituteId: settings.defaultInstituteId
    });
    if (!course || !subcourse || String(subcourse.courseId) !== String(course._id)) {
      throw new AppError("Invalid course/subcourse selection for default institute.", 400);
    }
  }

  const hash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    firstName: payload.first_name,
    lastName: payload.last_name,
    email: payload.email.toLowerCase(),
    mobNo: payload.mob_no,
    passwordHash: hash,
    instituteId: settings.defaultInstituteId,
    roles: ["student"],
    isApproved: false,
    active: true
  });

  if (course && subcourse) {
    try {
      await UserSelectedCourse.create({
        userId: user._id,
        courseId: course._id,
        subcourseId: subcourse._id
      });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  return serializeUser(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new AppError("Invalid credentials.", 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials.", 401);
  if (!user.isApproved) throw new AppError("User is pending approval.", 403);
  if (!user.active) throw new AppError("User inactive.", 401);
  user.lastLogin = new Date();
  await user.save();
  return {
    access_token: signToken({
      sub: user._id.toString(),
      institute_id: user.instituteId?.toString(),
      roles: user.roles || []
    }),
    token_type: "bearer"
  };
};

module.exports = { register, login };
