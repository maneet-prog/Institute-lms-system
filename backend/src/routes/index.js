const express = require("express");
const authRoutes = require("./authRoutes");
const instituteRoutes = require("./instituteRoutes");
const userRoutes = require("./userRoutes");
const { publicRouter: coursePublicRouter, protectedRouter: courseProtectedRouter } = require("./courseRoutes");
const contentRoutes = require("./contentRoutes");
const enrollmentRoutes = require("./enrollmentRoutes");
const batchRoutes = require("./batchRoutes");
const progressRoutes = require("./progressRoutes");
const studentRoutes = require("./studentRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/institutes", instituteRoutes);
router.use("/users", userRoutes);
router.use(dashboardRoutes);
router.use("/progress", progressRoutes);
router.use("/students", studentRoutes);

// Mount course public routes FIRST (no auth required)
router.use("/", coursePublicRouter);

// Mount other routes
router.use("/", contentRoutes);
router.use("/", enrollmentRoutes);
router.use("/", batchRoutes);

// Mount course protected routes LAST (auth required)
router.use("/", courseProtectedRouter);

module.exports = router;
