const bcrypt = require("bcryptjs");
const Institute = require("../models/Institute");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sameId } = require("./accessService");
const { serializeInstitute } = require("../utils/serializers");

const getPrimaryInstituteAdmin = (instituteId) =>
  User.findOne({ instituteId, roles: "institute_admin" }).select("+passwordHash");

const createInstitute = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) {
    throw new AppError("Institute email is already used by another login account.", 409);
  }

  const institute = await Institute.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    mobNo: payload.mob_no,
    country: payload.country,
    state: payload.state,
    place: payload.place,
    pincode: payload.pincode,
    active: payload.active
  });

  await User.create({
    instituteId: institute._id,
    firstName: payload.admin_first_name || "Institute",
    lastName: payload.admin_last_name || "Admin",
    email: payload.email.toLowerCase(),
    mobNo: payload.mob_no,
    passwordHash: await bcrypt.hash(payload.admin_password, 12),
    roles: ["institute_admin"],
    isApproved: true,
    active: payload.active
  });

  return serializeInstitute(institute);
};

const listInstitutes = async (currentUser) => {
  if (currentUser.roles?.includes("super_admin")) {
    const institutes = await Institute.find({}).sort({ createdAt: -1 });
    return institutes.map(serializeInstitute);
  }

  const institute = await Institute.findOne({ _id: currentUser.instituteId, active: true });
  return institute ? [serializeInstitute(institute)] : [];
};

const updateInstitute = async (id, payload) => {
  const institute = await Institute.findById(id);
  if (!institute) throw new AppError("Institute not found.", 404);

  const primaryAdmin = await getPrimaryInstituteAdmin(id);
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser && (!primaryAdmin || !sameId(existingUser._id, primaryAdmin._id))) {
    throw new AppError("Institute email is already used by another login account.", 409);
  }

  institute.name = payload.name;
  institute.email = payload.email.toLowerCase();
  institute.mobNo = payload.mob_no;
  institute.country = payload.country;
  institute.state = payload.state;
  institute.place = payload.place;
  institute.pincode = payload.pincode;
  institute.active = payload.active;

  let admin = primaryAdmin;
  if (!admin && payload.admin_password) {
    admin = await User.create({
      instituteId: institute._id,
      firstName: payload.admin_first_name || "Institute",
      lastName: payload.admin_last_name || "Admin",
      email: payload.email.toLowerCase(),
      mobNo: payload.mob_no,
      passwordHash: await bcrypt.hash(payload.admin_password, 12),
      roles: ["institute_admin"],
      isApproved: payload.active,
      active: payload.active
    });
  }

  if (admin) {
    admin.email = payload.email.toLowerCase();
    admin.mobNo = payload.mob_no;
    admin.active = payload.active;
    admin.isApproved = payload.active;
    if (payload.admin_first_name) admin.firstName = payload.admin_first_name;
    if (payload.admin_last_name) admin.lastName = payload.admin_last_name;
    if (payload.admin_password) {
      admin.passwordHash = await bcrypt.hash(payload.admin_password, 12);
    }
    await admin.save();
  }

  await institute.save();
  return serializeInstitute(institute);
};

const deleteInstitute = async (id) => {
  const institute = await Institute.findById(id);
  if (!institute) throw new AppError("Institute not found.", 404);

  const primaryAdmin = await getPrimaryInstituteAdmin(id);
  if (primaryAdmin) {
    primaryAdmin.active = false;
    await primaryAdmin.save();
  }

  institute.active = false;
  await institute.save();
};

module.exports = { createInstitute, listInstitutes, updateInstitute, deleteInstitute };
