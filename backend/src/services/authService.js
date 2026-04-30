const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Course = require("../models/Course");
const PendingRegistration = require("../models/PendingRegistration");
const Subcourse = require("../models/Subcourse");
const SystemSetting = require("../models/SystemSetting");
const User = require("../models/User");
const { UserSelectedCourse } = require("../models/Enrollment");
const env = require("../config/env");
const { sendMail, sendSms } = require("./notificationService");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/token");
const { serializeUser } = require("../utils/serializers");

const buildOtpHash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const generateTempPassword = () => crypto.randomBytes(6).toString("base64url");

const getDefaultInstitute = async () => {
  const settings = await SystemSetting.findOne().lean();
  if (!settings?.defaultInstituteId) {
    throw new AppError("System settings/default institute not configured.", 500);
  }
  return settings.defaultInstituteId;
};

const validateCourseSelection = async (payload, instituteId) => {
  const hasCourseSelection = Boolean(payload.course_id || payload.subcourse_id);
  if (hasCourseSelection && !(payload.course_id && payload.subcourse_id)) {
    throw new AppError("Both course and subcourse are required together.", 400);
  }

  let course = null;
  let subcourse = null;
  if (payload.course_id && payload.subcourse_id) {
    course = await Course.findOne({
      _id: payload.course_id,
      instituteId
    });
    subcourse = await Subcourse.findOne({
      _id: payload.subcourse_id,
      instituteId
    });
    if (!course || !subcourse || String(subcourse.courseId) !== String(course._id)) {
      throw new AppError("Invalid course/subcourse selection for default institute.", 400);
    }
  }

  return { course, subcourse };
};

const register = async (payload) => {
  const normalizedEmail = payload.email.toLowerCase();
  const [emailExists, defaultInstituteId] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    getDefaultInstitute()
  ]);
  if (emailExists) throw new AppError("Email already registered.", 409);

  const { course, subcourse } = await validateCourseSelection(payload, defaultInstituteId);
  const emailOtp = generateOtp();
  const mobileOtp = generateOtp();
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);

  const pending = await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    {
      instituteId: defaultInstituteId,
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: normalizedEmail,
      mobNo: payload.mob_no,
      passwordHash,
      courseId: course?._id || null,
      subcourseId: subcourse?._id || null,
      emailOtpHash: buildOtpHash(emailOtp),
      mobileOtpHash: buildOtpHash(mobileOtp),
      emailVerifiedAt: null,
      mobileVerifiedAt: null,
      expiresAt,
      lastSentAt: new Date()
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );

  const loginUrl = `${env.frontendBaseUrl.replace(/\/$/, "")}/login`;
  const verificationContext = {
    verification_id: String(pending._id),
    expires_at: expiresAt.toISOString()
  };

  const [mailResult, smsResult] = await Promise.all([
    sendMail({
      to: normalizedEmail,
      subject: "Your Institute LMS registration OTP",
      text: `Use email OTP ${emailOtp} and mobile OTP ${mobileOtp} to complete registration. This code expires in ${env.otpTtlMinutes} minutes. Login URL: ${loginUrl}`,
      html: `<p>Use <strong>${emailOtp}</strong> as your email OTP and <strong>${mobileOtp}</strong> as your mobile OTP.</p><p>This code expires in ${env.otpTtlMinutes} minutes.</p><p><a href="${loginUrl}">Open LMS</a></p>`,
      metadata: { purpose: "registration-otp", verification_id: verificationContext.verification_id }
    }),
    sendSms({
      to: payload.mob_no,
      message: `Institute LMS OTP: ${mobileOtp}. Valid for ${env.otpTtlMinutes} minutes.`,
      metadata: { purpose: "registration-otp", verification_id: verificationContext.verification_id }
    })
  ]);

  return {
    ...verificationContext,
    message: "Verification codes sent. Complete both OTP checks to finish registration.",
    delivery: env.nodeEnv !== "production"
      ? {
          email_preview: mailResult.preview || null,
          sms_preview: smsResult.preview || null,
          email_otp: emailOtp,
          mobile_otp: mobileOtp
        }
      : undefined
  };
};

const verifyRegistration = async ({ verification_id, email_otp, mobile_otp }) => {
  const pending = await PendingRegistration.findById(verification_id).select(
    "+passwordHash +emailOtpHash +mobileOtpHash"
  );
  if (!pending) {
    throw new AppError("Verification session not found or expired.", 404);
  }
  if (pending.expiresAt.getTime() < Date.now()) {
    await PendingRegistration.findByIdAndDelete(pending._id);
    throw new AppError("Verification session expired. Please register again.", 410);
  }
  if (buildOtpHash(email_otp) !== pending.emailOtpHash) {
    throw new AppError("Email OTP is incorrect.", 400);
  }
  if (buildOtpHash(mobile_otp) !== pending.mobileOtpHash) {
    throw new AppError("Mobile OTP is incorrect.", 400);
  }

  const [existingEmailUser] = await Promise.all([
    User.findOne({ email: pending.email })
  ]);
  if (existingEmailUser) {
    await PendingRegistration.findByIdAndDelete(pending._id);
    throw new AppError("Email already registered.", 409);
  }

  const user = await User.create({
    firstName: pending.firstName,
    lastName: pending.lastName,
    email: pending.email,
    mobNo: pending.mobNo,
    passwordHash: pending.passwordHash,
    instituteId: pending.instituteId,
    roles: ["student"],
    isApproved: false,
    active: true
  });

  if (pending.courseId && pending.subcourseId) {
    try {
      await UserSelectedCourse.create({
        userId: user._id,
        courseId: pending.courseId,
        subcourseId: pending.subcourseId
      });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  await PendingRegistration.findByIdAndDelete(pending._id);

  const courseLabel = pending.courseId && pending.subcourseId
    ? `Selected course path IDs: ${String(pending.courseId)} / ${String(pending.subcourseId)}`
    : "No course path selected";
  await sendMail({
    to: env.notificationEmail,
    subject: "New verified student registration",
    text: `A new student finished OTP verification.\nName: ${pending.firstName} ${pending.lastName}\nEmail: ${pending.email}\nMobile: ${pending.mobNo}\n${courseLabel}`,
    html: `<p>A new student finished OTP verification.</p><p><strong>Name:</strong> ${pending.firstName} ${pending.lastName}<br/><strong>Email:</strong> ${pending.email}<br/><strong>Mobile:</strong> ${pending.mobNo}</p><p>${courseLabel}</p>`,
    metadata: { purpose: "admin-registration-notification", user_id: String(user._id) }
  }).catch((error) => {
    console.error("Failed to send admin registration notification", error);
  });

  return {
    message: "Registration verified successfully. Your account is pending admin approval.",
    user: serializeUser(user)
  };
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

const forgotPassword = async ({ email, mob_no }) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, mobNo: mob_no, active: true }).select("+passwordHash");
  if (!user) {
    return {
      message: "If the account exists, password instructions have been sent."
    };
  }

  const tempPassword = generateTempPassword();
  user.passwordHash = await bcrypt.hash(tempPassword, 12);
  await user.save();

  const loginUrl = `${env.frontendBaseUrl.replace(/\/$/, "")}/login`;
  const mailResult = await sendMail({
    to: normalizedEmail,
    subject: "Your Institute LMS temporary password",
    text: `Use this temporary password to sign in and update your password immediately.\nEmail: ${normalizedEmail}\nTemporary password: ${tempPassword}\nLogin: ${loginUrl}`,
    html: `<p>Use this temporary password to sign in and update your password immediately.</p><p><strong>Email:</strong> ${normalizedEmail}<br/><strong>Temporary password:</strong> ${tempPassword}</p><p><a href="${loginUrl}">Open login</a></p>`,
    metadata: { purpose: "forgot-password", user_id: String(user._id) }
  });

  return {
    message: "If the account exists, password instructions have been sent.",
    delivery: env.nodeEnv !== "production"
      ? {
          email_preview: mailResult.preview || null,
          temporary_password: tempPassword
        }
      : undefined
  };
};

module.exports = { register, verifyRegistration, login, forgotPassword };
