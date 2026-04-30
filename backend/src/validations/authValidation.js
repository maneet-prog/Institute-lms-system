const Joi = require("joi");

exports.registerSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  mob_no: Joi.string().required(),
  password: Joi.string().min(8).required(),
  course_id: Joi.string().allow("", null),
  subcourse_id: Joi.string().allow("", null)
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.verifyRegistrationSchema = Joi.object({
  verification_id: Joi.string().required(),
  email_otp: Joi.string().length(6).required(),
  mobile_otp: Joi.string().length(6).required()
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  mob_no: Joi.string().required()
});
