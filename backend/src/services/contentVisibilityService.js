const { sameId } = require("./accessService");

const isContentAssignedToStudent = (content, userId) =>
  (content?.assignedStudentIds || []).some((studentId) => sameId(studentId, userId));

const isContentHiddenForStudent = (content, userId) =>
  (content?.hiddenStudentIds || []).some((studentId) => sameId(studentId, userId));

const isContentVisibleToStudent = (content, userId) => {
  if (!content || content.active === false) {
    return false;
  }

  if (isContentHiddenForStudent(content, userId)) {
    return false;
  }

  if (content.visibilityScope === "selected_students") {
    return isContentAssignedToStudent(content, userId);
  }

  return true;
};

module.exports = {
  isContentAssignedToStudent,
  isContentHiddenForStudent,
  isContentVisibleToStudent
};
