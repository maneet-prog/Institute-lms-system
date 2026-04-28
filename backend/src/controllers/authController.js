const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(user);
});

exports.login = asyncHandler(async (req, res) => {
  const token = await authService.login(req.body);
  res.json(token);
});
