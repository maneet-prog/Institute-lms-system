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
  downloadable: Joi.boolean().default(false),
  response_type: Joi.string().allow("", null),
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
  downloadable: Joi.boolean(),
  response_type: Joi.string().allow("", null),
  duration: Joi.number().integer().min(0),
  institute_id: Joi.string().optional(),
  replace_file: Joi.boolean().default(false)
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
