const express = require("express");
const controller = require("../controllers/resourceController");
const { protect, allowRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/assign", protect, allowRoles("super_admin", "institute_admin", "teacher"), controller.assign);
router.post("/remove", protect, allowRoles("super_admin", "institute_admin", "teacher"), controller.remove);

module.exports = router;
