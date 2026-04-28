const express = require("express");
const controller = require("../controllers/authController");
const validate = require("../middlewares/validateMiddleware");
const { registerSchema, loginSchema } = require("../validations/authValidation");

const router = express.Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);

module.exports = router;
