const bcrypt = require("bcryptjs");
const env = require("../config/env");
const Institute = require("../models/Institute");
const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");

const DEFAULT_INSTITUTE_EMAIL = "default@institute.com";

const ensureDefaultInstituteAndSettings = async () => {
  let settings = await SystemSetting.findOne();
  let defaultInstitute = null;

  if (!settings) {
    defaultInstitute = await Institute.create({
      name: "Default Institute",
      email: DEFAULT_INSTITUTE_EMAIL,
      mobNo: "0000000000",
      country: "N/A",
      state: "N/A",
      place: "N/A",
      pincode: "000000",
      active: true
    });
    settings = await SystemSetting.create({
      defaultInstituteId: defaultInstitute._id,
      allowMultiTenant: true
    });
    return { settings, defaultInstitute };
  }

  if (settings.defaultInstituteId) {
    defaultInstitute = await Institute.findById(settings.defaultInstituteId);
    if (defaultInstitute && defaultInstitute.email.endsWith(".local")) {
      defaultInstitute.email = DEFAULT_INSTITUTE_EMAIL;
      await defaultInstitute.save();
    }
  }

  if (!defaultInstitute) {
    defaultInstitute = await Institute.findOne({ email: DEFAULT_INSTITUTE_EMAIL });
    if (!defaultInstitute) {
      defaultInstitute = await Institute.create({
        name: "Default Institute",
        email: DEFAULT_INSTITUTE_EMAIL,
        mobNo: "0000000000",
        country: "N/A",
        state: "N/A",
        place: "N/A",
        pincode: "000000",
        active: true
      });
    }
    settings.defaultInstituteId = defaultInstitute._id;
    await settings.save();
  }

  return { settings, defaultInstitute };
};

const ensureDefaultSuperAdmin = async (defaultInstituteId) => {
  const passwordHash = await bcrypt.hash(env.defaultSuperAdminPassword, 12);
  let admin = await User.findOne({ email: env.defaultSuperAdminEmail.toLowerCase() }).select("+passwordHash");

  if (!admin) {
    admin = await User.create({
      instituteId: defaultInstituteId,
      firstName: env.defaultSuperAdminFirstName,
      lastName: env.defaultSuperAdminLastName,
      email: env.defaultSuperAdminEmail.toLowerCase(),
      mobNo: env.defaultSuperAdminMobNo,
      passwordHash,
      roles: ["super_admin"],
      isApproved: true,
      active: true
    });
    return admin;
  }

  admin.instituteId = defaultInstituteId;
  admin.firstName = env.defaultSuperAdminFirstName;
  admin.lastName = env.defaultSuperAdminLastName;
  admin.mobNo = env.defaultSuperAdminMobNo;
  admin.roles = Array.from(new Set([...(admin.roles || []), "super_admin"]));
  admin.isApproved = true;
  admin.active = true;
  admin.passwordHash = passwordHash;
  await admin.save();
  return admin;
};

const bootstrapDefaults = async () => {
  const { settings } = await ensureDefaultInstituteAndSettings();
  await ensureDefaultSuperAdmin(settings.defaultInstituteId);
};

module.exports = { bootstrapDefaults };
