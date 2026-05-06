const { UserContent } = require("../models/Enrollment");
const Content = require("../models/Content");
const AppError = require("../utils/AppError");

const getInstituteId = (user, tenant) => tenant?.instituteId || user?.instituteId || null;

const assignResource = async ({ userId, contentId }, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) throw new AppError("Institute is not configured.", 403);

  const content = await Content.findOne({ _id: contentId, instituteId });
  if (!content) throw new AppError("Content not found in this institute.", 404);

  const existing = await UserContent.findOne({ userId, contentId });
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      existing.assignedBy = user._id;
      await existing.save();
    }
    return existing;
  }

  const assignment = new UserContent({
    instituteId,
    userId,
    contentId,
    assignedBy: user._id,
    active: true
  });
  await assignment.save();
  return assignment;
};

const removeResource = async ({ userId, contentId }, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) throw new AppError("Institute is not configured.", 403);

  const existing = await UserContent.findOne({ userId, contentId, instituteId });
  if (existing && existing.active) {
    existing.active = false;
    await existing.save();
  }
  return existing;
};

module.exports = {
  assignResource,
  removeResource
};
