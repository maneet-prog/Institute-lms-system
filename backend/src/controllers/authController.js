const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

exports.register = asyncHandler(async (req, res) => {
  const registration = await authService.register(req.body);
  res.status(201).json(registration);
});

exports.verifyRegistration = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.verifyRegistration(req.body));
});

exports.login = asyncHandler(async (req, res) => {
  const token = await authService.login(req.body);
  res.json(token);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  res.json(await authService.forgotPassword(req.body));
});
