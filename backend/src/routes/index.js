const express = require("express");
const authRoutes = require("./authRoutes");
const instituteRoutes = require("./instituteRoutes");
const userRoutes = require("./userRoutes");
const courseRoutes = require("./courseRoutes");
const contentRoutes = require("./contentRoutes");
const enrollmentRoutes = require("./enrollmentRoutes");
const batchRoutes = require("./batchRoutes");
const progressRoutes = require("./progressRoutes");
const studentRoutes = require("./studentRoutes");
const submissionRoutes = require("./submissionRoutes");

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/institutes", instituteRoutes);
router.use("/users", userRoutes);
router.use("/progress", progressRoutes);
router.use("/students", studentRoutes);
router.use("/submissions", submissionRoutes);
router.use("/", courseRoutes);
router.use("/", contentRoutes);
router.use("/", enrollmentRoutes);
router.use("/", batchRoutes);

module.exports = router;
