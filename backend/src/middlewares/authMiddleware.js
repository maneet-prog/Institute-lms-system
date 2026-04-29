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
    
    // Get roles from token (with fallback to user roles)
    let tokenRoles = Array.isArray(decoded.roles) ? decoded.roles : [];
    let userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    // Use token roles if available and non-empty, otherwise use user roles
    const effectiveRoles = tokenRoles.length > 0 ? tokenRoles : userRoles;
    
    req.user = user;
    req.auth = {
      userId: decoded.sub,
      instituteId: decoded.institute_id || user.instituteId,
      roles: effectiveRoles
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
    if (!req.auth) return next(new AppError("Authorization context missing.", 401));
    
    const effectiveRoles = req.auth.roles || req.user.roles || [];
    
    // Ensure effectiveRoles is always an array
    const roleArray = Array.isArray(effectiveRoles) ? effectiveRoles : [];
    
    if (roleArray.length === 0) {
      return next(new AppError("User has no roles assigned. Please contact administrator.", 403));
    }
    
    const hasRequiredRole = roleArray.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      return next(new AppError("Not enough privileges for this action.", 403));
    }
    
    return next();
  };

module.exports = { protect, allowRoles };
