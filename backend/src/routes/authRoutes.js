const express = require("express");
const controller = require("../controllers/authController");
const validate = require("../middlewares/validateMiddleware");
const {
  registerSchema,
  loginSchema,
  verifyRegistrationSchema,
  forgotPasswordSchema
} = require("../validations/authValidation");

const router = express.Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/register/verify", validate(verifyRegistrationSchema), controller.verifyRegistration);
router.post("/login", validate(loginSchema), controller.login);
router.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);

module.exports = router;
