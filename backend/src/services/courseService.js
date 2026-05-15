const Course = require("../models/Course");
const Subcourse = require("../models/Subcourse");
const Module = require("../models/Module");
const Content = require("../models/Content");
const SystemSetting = require("../models/SystemSetting");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const { uploadFile, deleteFile } = require("./storageService");
const {
  hasRole,
  resolveInstituteScope,
  getTeacherScope,
  getStudentEnrollmentScope,
  sameId
} = require("./accessService");
const {
  serializeCourse,
  serializeSubcourse,
  serializeModule
} = require("../utils/serializers");

const findCourse = (courseId, instituteId) => Course.findOne({ _id: courseId, instituteId });
const findSubcourse = (subcourseId, instituteId) => Subcourse.findOne({ _id: subcourseId, instituteId });
const findModule = (moduleId, instituteId) => Module.findOne({ _id: moduleId, instituteId });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GENERAL_MODULE_SUBCATEGORY = Object.freeze({
  subcategoryId: "general",
  name: "general",
  active: true
});

const inferModuleExamType = (moduleName = "") => {
  const normalized = String(moduleName).trim().toLowerCase();
  if (normalized.includes("reading")) return "reading";
  if (normalized.includes("writing")) return "writing";
  if (normalized.includes("listening") || normalized.includes("listing")) return "listening";
  if (normalized.includes("speaking") || normalized.includes("spoken")) return "speaking";
  return "general";
};

const normalizeModuleSubcategoryName = (value = "") => String(value).trim();

const getModuleSubcategories = (moduleItem) => {
  const rawItems = Array.isArray(moduleItem?.moduleSubcategories) ? moduleItem.moduleSubcategories : [];
  const unique = new Map([[GENERAL_MODULE_SUBCATEGORY.subcategoryId, { ...GENERAL_MODULE_SUBCATEGORY }]]);

  rawItems.forEach((item) => {
    if (!item || item.active === false) return;
    const subcategoryId = String(item.subcategoryId || "").trim();
    const name = normalizeModuleSubcategoryName(item.name);
    if (!subcategoryId || !name || subcategoryId === GENERAL_MODULE_SUBCATEGORY.subcategoryId) return;
    unique.set(subcategoryId, {
      subcategoryId,
      name,
      active: true
    });
  });

  return [...unique.values()];
};

const assertModuleManagementAccess = async (moduleItem, instituteId, currentUser) => {
  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, instituteId);
    if (!teacherScope.coursePairs.has(`${String(moduleItem.courseId)}::${String(moduleItem.subcourseId)}`)) {
      throw new AppError("Teachers can only manage modules in their assigned batch course paths.", 403);
    }
  }
};

const findModuleSubcategoryByName = (moduleItem, name, excludeId) => {
  const normalizedName = normalizeModuleSubcategoryName(name).toLowerCase();
  return getModuleSubcategories(moduleItem).find(
    (item) =>
      item.subcategoryId !== GENERAL_MODULE_SUBCATEGORY.subcategoryId &&
      item.subcategoryId !== excludeId &&
      item.name.toLowerCase() === normalizedName
  );
};

const findDuplicateModuleByName = ({ instituteId, subcourseId, moduleName, excludeId }) =>
  Module.findOne({
    instituteId,
    subcourseId,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    moduleName: { $regex: `^${escapeRegex(String(moduleName).trim())}$`, $options: "i" }
  });

const buildCatalogUploadSegments = (entityType, instituteId, entityId) => [
  "institutes",
  instituteId,
  "catalog",
  entityType,
  entityId
];

const syncCatalogImage = async ({ entity, file, imageUrl, segments }) => {
  const uploaded = file ? await uploadFile(file, segments) : null;
  const previousStorageKey = entity.imageStorageKey;

  entity.description = imageUrl?.description ?? entity.description ?? null;
  if (imageUrl?.resolved !== undefined) {
    entity.imageUrl = imageUrl.resolved;
  }
  if (uploaded) {
    entity.imageUrl = uploaded.fileUrl;
    entity.imageStorageKey = uploaded.storageKey;
  }

  await entity.save();

  if (uploaded && previousStorageKey && previousStorageKey !== uploaded.storageKey) {
    await deleteFile(previousStorageKey);
  }
};

const createCourse = async (payload, file, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    throw new AppError("Teachers cannot create top-level courses.", 403);
  }

  const course = await Course.create({
    instituteId,
    courseName: payload.course_name,
    description: payload.description || null,
    imageUrl: payload.image_url || null,
    active: payload.active
  });

  if (file) {
    try {
      await syncCatalogImage({
        entity: course,
        file,
        imageUrl: { description: payload.description || null },
        segments: buildCatalogUploadSegments("courses", instituteId, course._id)
      });
    } catch (error) {
      await Course.findByIdAndDelete(course._id);
      throw error;
    }
  }
  return serializeCourse(course);
};

const listCourses = async ({ tenant, currentUser, instituteId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(hasRole(currentUser, "super_admin", "institute_admin") ? {} : { active: true })
  };
  const courses = await Course.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return courses
      .filter((course) => teacherScope.courseIds.has(String(course._id)))
      .map(serializeCourse);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentEnrollmentScope(currentUser._id, scopedInstituteId);
    return courses
      .filter((course) => studentScope.courseIds.has(String(course._id)))
      .map(serializeCourse);
  }

  return courses.map(serializeCourse);
};

const listPublicCourses = async () => {
  const settings = await SystemSetting.findOne().lean();
  if (!settings?.defaultInstituteId) {
    throw new AppError("System settings/default institute not configured.", 500);
  }

  const courses = await Course.find({
    instituteId: settings.defaultInstituteId,
    active: true
  }).sort({ createdAt: 1 });
  return courses.map(serializeCourse);
};

const updateCourse = async (id, payload, file, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const course = await findCourse(id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);

  const previousStorageKey = course.imageStorageKey;
  const previousImageUrl = course.imageUrl;
  course.courseName = payload.course_name;
  course.description = payload.description || null;
  course.imageUrl = payload.image_url || null;
  if (!file && payload.image_url !== undefined && payload.image_url !== previousImageUrl && previousStorageKey) {
    await deleteFile(previousStorageKey);
    course.imageStorageKey = null;
  }
  course.active = payload.active;
  if (file) {
    await syncCatalogImage({
      entity: course,
      file,
      imageUrl: {
        description: payload.description || null,
        resolved: payload.image_url || null
      },
      segments: buildCatalogUploadSegments("courses", instituteId, course._id)
    });
  } else {
    await course.save();
  }
  return serializeCourse(course);
};

const deleteCourse = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const course = await findCourse(id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);
  course.active = false;
  await course.save();
};

const createSubcourse = async (payload, file, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    throw new AppError("Teachers cannot create top-level subcourses.", 403);
  }

  const course = await findCourse(payload.course_id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);

  const subcourse = await Subcourse.create({
    instituteId,
    courseId: payload.course_id,
    subcourseName: payload.subcourse_name,
    description: payload.description || null,
    imageUrl: payload.image_url || null,
    active: payload.active
  });

  if (file) {
    try {
      await syncCatalogImage({
        entity: subcourse,
        file,
        imageUrl: { description: payload.description || null },
        segments: buildCatalogUploadSegments("subcourses", instituteId, subcourse._id)
      });
    } catch (error) {
      await Subcourse.findByIdAndDelete(subcourse._id);
      throw error;
    }
  }
  return serializeSubcourse(subcourse);
};

const listSubcourses = async ({ tenant, currentUser, instituteId, courseId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(courseId ? { courseId } : {}),
    ...(hasRole(currentUser, "super_admin", "institute_admin") ? {} : { active: true })
  };
  const subcourses = await Subcourse.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return subcourses
      .filter((item) => teacherScope.coursePairs.has(`${String(item.courseId)}::${String(item._id)}`))
      .map(serializeSubcourse);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentEnrollmentScope(currentUser._id, scopedInstituteId);
    return subcourses
      .filter((item) => studentScope.coursePairs.has(`${String(item.courseId)}::${String(item._id)}`))
      .map(serializeSubcourse);
  }

  return subcourses.map(serializeSubcourse);
};

const listPublicSubcourses = async (courseId) => {
  const settings = await SystemSetting.findOne().lean();
  if (!settings?.defaultInstituteId) {
    throw new AppError("System settings/default institute not configured.", 500);
  }

  const subcourses = await Subcourse.find({
    instituteId: settings.defaultInstituteId,
    active: true,
    ...(courseId ? { courseId } : {})
  }).sort({ createdAt: 1 });
  return subcourses.map(serializeSubcourse);
};

const updateSubcourse = async (id, payload, file, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const subcourse = await findSubcourse(id, instituteId);
  if (!subcourse) throw new AppError("Subcourse not found.", 404);

  const course = await findCourse(payload.course_id, instituteId);
  if (!course) throw new AppError("Course not found.", 404);

  const previousStorageKey = subcourse.imageStorageKey;
  const previousImageUrl = subcourse.imageUrl;
  subcourse.courseId = payload.course_id;
  subcourse.subcourseName = payload.subcourse_name;
  subcourse.description = payload.description || null;
  subcourse.imageUrl = payload.image_url || null;
  if (!file && payload.image_url !== undefined && payload.image_url !== previousImageUrl && previousStorageKey) {
    await deleteFile(previousStorageKey);
    subcourse.imageStorageKey = null;
  }
  subcourse.active = payload.active;
  if (file) {
    await syncCatalogImage({
      entity: subcourse,
      file,
      imageUrl: {
        description: payload.description || null,
        resolved: payload.image_url || null
      },
      segments: buildCatalogUploadSegments("subcourses", instituteId, subcourse._id)
    });
  } else {
    await subcourse.save();
  }
  return serializeSubcourse(subcourse);
};

const deleteSubcourse = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const subcourse = await findSubcourse(id, instituteId);
  if (!subcourse) throw new AppError("Subcourse not found.", 404);
  subcourse.active = false;
  await subcourse.save();
};

const createModule = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const subcourse = await findSubcourse(payload.subcourse_id, instituteId);
  if (!subcourse || !sameId(subcourse.courseId, payload.course_id)) {
    throw new AppError("Subcourse not found.", 404);
  }

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, instituteId);
    if (!teacherScope.coursePairs.has(`${payload.course_id}::${payload.subcourse_id}`)) {
      throw new AppError("Teachers can only manage course data for their assigned batches.", 403);
    }
  }

  const duplicateModule = await findDuplicateModuleByName({
    instituteId,
    subcourseId: payload.subcourse_id,
    moduleName: payload.module_name
  });
  const inferredExamType = inferModuleExamType(payload.module_name);

  if (duplicateModule) {
    if (!payload.replace_existing) {
      throw new AppError("A module with this name already exists in the selected subcourse. Replace it or cancel.", 409);
    }

    duplicateModule.courseId = payload.course_id;
    duplicateModule.subcourseId = payload.subcourse_id;
    duplicateModule.moduleName = payload.module_name.trim();
    duplicateModule.examType = inferredExamType;
    duplicateModule.active = payload.active;
    await duplicateModule.save();
    return serializeModule(duplicateModule);
  }

  const moduleItem = await Module.create({
    instituteId,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id,
    moduleName: payload.module_name.trim(),
    examType: inferredExamType,
    active: payload.active
  });
  return serializeModule(moduleItem);
};

const updateModule = async (id, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const moduleItem = await findModule(id, instituteId);
  if (!moduleItem) throw new AppError("Module not found.", 404);

  const subcourse = await findSubcourse(payload.subcourse_id, instituteId);
  if (!subcourse || !sameId(subcourse.courseId, payload.course_id)) {
    throw new AppError("Subcourse not found.", 404);
  }

  const duplicateModule = await findDuplicateModuleByName({
    instituteId,
    subcourseId: payload.subcourse_id,
    moduleName: payload.module_name,
    excludeId: moduleItem._id
  });
  if (duplicateModule) {
    throw new AppError("Another module with this name already exists in the selected subcourse.", 409);
  }

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, instituteId);
    const currentPair = `${String(moduleItem.courseId)}::${String(moduleItem.subcourseId)}`;
    const nextPair = `${payload.course_id}::${payload.subcourse_id}`;
    if (!teacherScope.coursePairs.has(currentPair) || !teacherScope.coursePairs.has(nextPair)) {
      throw new AppError("Teachers can only manage modules in their assigned batch course paths.", 403);
    }
  }

  moduleItem.courseId = payload.course_id;
  moduleItem.subcourseId = payload.subcourse_id;
  moduleItem.moduleName = payload.module_name.trim();
  moduleItem.examType = inferModuleExamType(payload.module_name);
  moduleItem.active = payload.active;
  await moduleItem.save();
  return serializeModule(moduleItem);
};

const deleteModule = async (id, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const moduleItem = await findModule(id, instituteId);
  if (!moduleItem) throw new AppError("Module not found.", 404);

  await assertModuleManagementAccess(moduleItem, instituteId, currentUser);

  moduleItem.active = false;
  await moduleItem.save();
  await Content.updateMany(
    { instituteId, moduleId: moduleItem._id, active: true },
    { $set: { active: false } }
  );
};

const listModules = async ({ tenant, currentUser, instituteId, courseId, subcourseId }) => {
  const scopedInstituteId = await resolveInstituteScope({
    requestedInstituteId: instituteId,
    tenant,
    currentUser
  });

  const query = {
    instituteId: scopedInstituteId,
    ...(courseId ? { courseId } : {}),
    ...(subcourseId ? { subcourseId } : {}),
    ...(hasRole(currentUser, "super_admin", "institute_admin") ? {} : { active: true })
  };
  const modules = await Module.find(query).sort({ createdAt: 1 });

  if (hasRole(currentUser, "teacher") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const teacherScope = await getTeacherScope(currentUser._id, scopedInstituteId);
    return modules
      .filter((item) => teacherScope.coursePairs.has(`${String(item.courseId)}::${String(item.subcourseId)}`))
      .map(serializeModule);
  }

  if (hasRole(currentUser, "student") && !hasRole(currentUser, "super_admin", "institute_admin")) {
    const studentScope = await getStudentEnrollmentScope(currentUser._id, scopedInstituteId);
    return modules
      .filter((item) => studentScope.coursePairs.has(`${String(item.courseId)}::${String(item.subcourseId)}`))
      .map(serializeModule);
  }

  return modules.map(serializeModule);
};

const createModuleSubcategory = async (moduleId, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const moduleItem = await findModule(moduleId, instituteId);
  if (!moduleItem) throw new AppError("Module not found.", 404);

  await assertModuleManagementAccess(moduleItem, instituteId, currentUser);

  const name = normalizeModuleSubcategoryName(payload.name);
  if (!name) {
    throw new AppError("Module subcategory name is required.", 400);
  }
  if (name.toLowerCase() === GENERAL_MODULE_SUBCATEGORY.name) {
    throw new AppError("The default general subcategory already exists.", 409);
  }
  if (findModuleSubcategoryByName(moduleItem, name)) {
    throw new AppError("A module subcategory with this name already exists.", 409);
  }

  moduleItem.moduleSubcategories = [
    ...(moduleItem.moduleSubcategories || []).filter((item) => item?.active !== false),
    {
      subcategoryId: new mongoose.Types.ObjectId().toString(),
      name,
      active: true
    }
  ];
  await moduleItem.save();

  return serializeModule(moduleItem);
};

const updateModuleSubcategory = async (moduleId, subcategoryId, payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  const moduleItem = await findModule(moduleId, instituteId);
  if (!moduleItem) throw new AppError("Module not found.", 404);

  await assertModuleManagementAccess(moduleItem, instituteId, currentUser);

  if (subcategoryId === GENERAL_MODULE_SUBCATEGORY.subcategoryId) {
    throw new AppError("The default general subcategory cannot be edited.", 400);
  }

  const target = (moduleItem.moduleSubcategories || []).find(
    (item) => item?.subcategoryId === subcategoryId && item?.active !== false
  );
  if (!target) {
    throw new AppError("Module subcategory not found.", 404);
  }

  const name = normalizeModuleSubcategoryName(payload.name);
  if (!name) {
    throw new AppError("Module subcategory name is required.", 400);
  }
  if (name.toLowerCase() === GENERAL_MODULE_SUBCATEGORY.name) {
    throw new AppError("The default general subcategory already exists.", 409);
  }
  if (findModuleSubcategoryByName(moduleItem, name, subcategoryId)) {
    throw new AppError("A module subcategory with this name already exists.", 409);
  }

  target.name = name;
  target.active = true;
  await moduleItem.save();

  return serializeModule(moduleItem);
};

const deleteModuleSubcategory = async (moduleId, subcategoryId, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({ tenant, currentUser });
  const moduleItem = await findModule(moduleId, instituteId);
  if (!moduleItem) throw new AppError("Module not found.", 404);

  await assertModuleManagementAccess(moduleItem, instituteId, currentUser);

  if (subcategoryId === GENERAL_MODULE_SUBCATEGORY.subcategoryId) {
    throw new AppError("The default general subcategory cannot be deleted.", 400);
  }

  const nextSubcategories = (moduleItem.moduleSubcategories || []).filter(
    (item) => item?.subcategoryId !== subcategoryId && item?.active !== false
  );
  if (nextSubcategories.length === (moduleItem.moduleSubcategories || []).filter((item) => item?.active !== false).length) {
    throw new AppError("Module subcategory not found.", 404);
  }

  moduleItem.moduleSubcategories = nextSubcategories;
  await moduleItem.save();
};

module.exports = {
  createCourse,
  listCourses,
  listPublicCourses,
  updateCourse,
  deleteCourse,
  createSubcourse,
  listSubcourses,
  listPublicSubcourses,
  updateSubcourse,
  deleteSubcourse,
  createModule,
  updateModule,
  deleteModule,
  listModules,
  createModuleSubcategory,
  updateModuleSubcategory,
  deleteModuleSubcategory
};
