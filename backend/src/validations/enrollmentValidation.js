const Joi = require("joi");

exports.enrollSchema = Joi.object({
  user_id: Joi.string().required(),
  course_id: Joi.string().required(),
  subcourse_id: Joi.string().required(),
  institute_id: Joi.string().optional()
});

exports.assignBatchSchema = Joi.object({
  user_id: Joi.string().required(),
  batch_id: Joi.string().required(),
  institute_id: Joi.string().optional()
});

exports.assignTeacherSchema = Joi.object({
  user_id: Joi.string().required(),
  batch_id: Joi.string().required(),
  institute_id: Joi.string().optional()
});

exports.removeAssignmentSchema = Joi.object({
  user_id: Joi.string().required(),
  batch_id: Joi.string().required(),
  institute_id: Joi.string().optional()
});

exports.progressSchema = Joi.object({
  module_id: Joi.string().required(),
  completed: Joi.boolean().default(true),
  progress_percent: Joi.number().min(0).max(100).default(100)
});

exports.studentSubmissionSchema = Joi.object({
  content_id: Joi.string().required(),
  response_type: Joi.string().required(),
  response_text: Joi.string().allow("", null),
  response_url: Joi.string().uri().allow("", null)
});
