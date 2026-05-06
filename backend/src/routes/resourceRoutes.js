const express = require("express");
const controller = require("../controllers/resourceController");
const { protect, allowRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect, allowRoles("super_admin", "institute_admin", "teacher"));
router.post("/assign", controller.assign);
router.post("/remove", controller.remove);

module.exports = router;
