const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/token");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return next(new AppError("Not authenticated.", 401));

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user || !user.active) return next(new AppError("User not found or inactive.", 401));
    const tokenRoles = Array.isArray(decoded.roles) ? decoded.roles : [];
    req.user = user;
    req.auth = {
      userId: decoded.sub,
      instituteId: decoded.institute_id || user.instituteId,
      roles: tokenRoles.length ? tokenRoles : user.roles || []
    };
    req.tenant = { instituteId: user.instituteId };
    return next();
  } catch (error) {
    return next(new AppError("Invalid token.", 401));
  }
};

const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError("Not authenticated.", 401));
    const effectiveRoles = req.auth?.roles || req.user.roles || [];
    const ok = effectiveRoles.some((role) => roles.includes(role));
    if (!ok) return next(new AppError("Not enough privileges for this action.", 403));
    return next();
  };

module.exports = { protect, allowRoles };
