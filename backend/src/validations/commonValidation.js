const Joi = require("joi");

exports.courseSchema = Joi.object({
  course_name: Joi.string().required(),
  description: Joi.string().allow("", null),
  institute_id: Joi.string().optional(),
  image_url: Joi.string().uri().allow("", null),
  active: Joi.boolean().default(true)
});

exports.subcourseSchema = Joi.object({
  course_id: Joi.string().required(),
  subcourse_name: Joi.string().required(),
  description: Joi.string().allow("", null),
  institute_id: Joi.string().optional(),
  image_url: Joi.string().uri().allow("", null),
  active: Joi.boolean().default(true)
});

exports.moduleSchema = Joi.object({
  course_id: Joi.string().required(),
  subcourse_id: Joi.string().required(),
  module_name: Joi.string().required(),
  institute_id: Joi.string().optional(),
  replace_existing: Joi.boolean().default(false),
  active: Joi.boolean().default(true)
});

exports.moduleUpdateSchema = Joi.object({
  course_id: Joi.string().required(),
  subcourse_id: Joi.string().required(),
  module_name: Joi.string().required(),
  institute_id: Joi.string().optional(),
  active: Joi.boolean().default(true)
});

exports.batchSchema = Joi.object({
  course_id: Joi.string().required(),
  subcourse_id: Joi.string().required(),
  batch_name: Joi.string().required(),
  description: Joi.string().allow("", null),
  room_name: Joi.string().allow("", null),
  schedule_notes: Joi.string().allow("", null),
  start_date: Joi.string().allow("", null),
  end_date: Joi.string().allow("", null),
  institute_id: Joi.string().optional(),
  active: Joi.boolean().default(true)
});

exports.contentSchema = Joi.object({
  batch_id: Joi.string().required(),
  module_id: Joi.string().required(),
  type: Joi.string().valid("text", "video", "audio", "pdf", "document", "quiz").required(),
  title: Joi.string().required(),
  description: Joi.string().allow("", null),
  external_url: Joi.string().uri().allow("", null),
  order_index: Joi.number().integer().min(0).default(0),
  category: Joi.string().default("reading"),
  instructions: Joi.string().allow("", null),
  response_type: Joi.string().allow("", null),
  attempt_limit: Joi.number().integer().min(0).allow("", null),
  exam_type_id: Joi.string().allow("", null),
  renderer_kind: Joi.string()
    .valid("tecai_reading", "tecai_writing", "structured_reading", "structured_writing", "custom")
    .allow("", null),
  timer_seconds: Joi.number().integer().min(0).allow("", null),
  exam_parts: Joi.alternatives().try(Joi.string(), Joi.array()).allow("", null),
  exam_metadata: Joi.alternatives().try(Joi.string(), Joi.object()).allow("", null),
  visibility_scope: Joi.string().valid("batch", "selected_students").default("batch"),
  assigned_student_ids: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).allow("", null),
  duration: Joi.number().integer().min(0).default(0),
  institute_id: Joi.string().optional()
});

exports.contentUpdateSchema = Joi.object({
  batch_id: Joi.string().optional(),
  title: Joi.string().optional(),
  type: Joi.string().valid("text", "video", "audio", "pdf", "document", "quiz").optional(),
  description: Joi.string().allow("", null),
  external_url: Joi.string().uri().allow("", null),
  order_index: Joi.number().integer().min(0),
  category: Joi.string().optional(),
  instructions: Joi.string().allow("", null),
  response_type: Joi.string().allow("", null),
  attempt_limit: Joi.number().integer().min(0).allow("", null),
  exam_type_id: Joi.string().allow("", null),
  renderer_kind: Joi.string()
    .valid("tecai_reading", "tecai_writing", "structured_reading", "structured_writing", "custom")
    .allow("", null),
  timer_seconds: Joi.number().integer().min(0).allow("", null),
  exam_parts: Joi.alternatives().try(Joi.string(), Joi.array()).allow("", null),
  exam_metadata: Joi.alternatives().try(Joi.string(), Joi.object()).allow("", null),
  visibility_scope: Joi.string().valid("batch", "selected_students").optional(),
  assigned_student_ids: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).allow("", null),
  duration: Joi.number().integer().min(0),
  institute_id: Joi.string().optional(),
  replace_file: Joi.boolean().default(false)
});

exports.contentStudentAccessSchema = Joi.object({
  student_id: Joi.string().required(),
  access_mode: Joi.string().valid("grant", "revoke").required(),
  institute_id: Joi.string().optional()
});

exports.reusableContentSchema = Joi.object({
  module_id: Joi.string().required(),
  type: Joi.string().valid("text", "video", "audio", "pdf", "document", "quiz").required(),
  title: Joi.string().required(),
  description: Joi.string().allow("", null),
  external_url: Joi.string().uri().allow("", null),
  order_index: Joi.number().integer().min(0).default(0),
  category: Joi.string().default("reading"),
  instructions: Joi.string().allow("", null),
  response_type: Joi.string().allow("", null),
  attempt_limit: Joi.number().integer().min(0).allow("", null),
  exam_type_id: Joi.string().allow("", null),
  renderer_kind: Joi.string()
    .valid("tecai_reading", "tecai_writing", "structured_reading", "structured_writing", "custom")
    .allow("", null),
  timer_seconds: Joi.number().integer().min(0).allow("", null),
  exam_parts: Joi.alternatives().try(Joi.string(), Joi.array()).allow("", null),
  exam_metadata: Joi.alternatives().try(Joi.string(), Joi.object()).allow("", null),
  duration: Joi.number().integer().min(0).default(0),
  institute_id: Joi.string().optional()
});

exports.reusableContentUpdateSchema = Joi.object({
  module_id: Joi.string().optional(),
  title: Joi.string().optional(),
  type: Joi.string().valid("text", "video", "audio", "pdf", "document", "quiz").optional(),
  description: Joi.string().allow("", null),
  external_url: Joi.string().uri().allow("", null),
  order_index: Joi.number().integer().min(0),
  category: Joi.string().optional(),
  instructions: Joi.string().allow("", null),
  response_type: Joi.string().allow("", null),
  attempt_limit: Joi.number().integer().min(0).allow("", null),
  exam_type_id: Joi.string().allow("", null),
  renderer_kind: Joi.string()
    .valid("tecai_reading", "tecai_writing", "structured_reading", "structured_writing", "custom")
    .allow("", null),
  timer_seconds: Joi.number().integer().min(0).allow("", null),
  exam_parts: Joi.alternatives().try(Joi.string(), Joi.array()).allow("", null),
  exam_metadata: Joi.alternatives().try(Joi.string(), Joi.object()).allow("", null),
  duration: Joi.number().integer().min(0),
  institute_id: Joi.string().optional(),
  replace_file: Joi.boolean().default(false)
});

exports.reusableContentAssignSchema = Joi.object({
  batch_id: Joi.string().required(),
  visibility_scope: Joi.string().valid("batch", "selected_students").default("batch"),
  assigned_student_ids: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).allow("", null),
  order_index: Joi.number().integer().min(0).allow("", null),
  title: Joi.string().allow("", null),
  institute_id: Joi.string().optional()
});

exports.instituteCreateSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mob_no: Joi.string().required(),
  country: Joi.string().required(),
  state: Joi.string().required(),
  place: Joi.string().required(),
  pincode: Joi.string().required(),
  active: Joi.boolean().default(true),
  institute_id: Joi.string().optional(),
  admin_first_name: Joi.string().default("Institute"),
  admin_last_name: Joi.string().default("Admin"),
  admin_password: Joi.string().min(8).required()
});

exports.instituteUpdateSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mob_no: Joi.string().required(),
  country: Joi.string().required(),
  state: Joi.string().required(),
  place: Joi.string().required(),
  pincode: Joi.string().required(),
  active: Joi.boolean().default(true),
  admin_first_name: Joi.string().allow("", null),
  admin_last_name: Joi.string().allow("", null),
  admin_password: Joi.string().min(8).allow("", null)
});
