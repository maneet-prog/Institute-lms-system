const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/userService");

exports.list = asyncHandler(async (req, res) =>
  res.json(
    await service.listUsers({
      instituteId: req.query.institute_id,
      tenant: req.tenant,
      currentUser: req.user
    })
  )
);
exports.create = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createUser(req.body, req.tenant, req.user))
);
exports.approve = asyncHandler(async (req, res) =>
  res.json(await service.approveUser(req.params.userId, req.body, req.tenant, req.user))
);
exports.assignInstitute = asyncHandler(async (req, res) =>
  res.json(await service.assignUserInstitute(req.params.userId, req.body.institute_id))
);
exports.assignRoles = asyncHandler(async (req, res) => {
  const roles = await service.assignRoles(req.params.userId, req.body.role_names, req.tenant, req.user);
  res.json({ message: `Roles assigned: ${roles.join(", ")}` });
});
exports.update = asyncHandler(async (req, res) =>
  res.json(await service.updateUser(req.params.userId, req.body, req.tenant, req.user))
);
exports.remove = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.userId, req.tenant, req.user);
  res.json({ message: "User deleted successfully." });
});
exports.updateProfile = asyncHandler(async (req, res) =>
  res.json(await service.updateProfile(req.user, req.body))
);
