const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const path = require("path");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/errorMiddleware");
const { bootstrapDefaults } = require("./services/bootstrapService");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(mongoSanitize());
app.use(xssClean());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use(routes);
app.use(errorMiddleware);

const start = async () => {
  await connectDb();
  await bootstrapDefaults();
  app.listen(env.port, () => {
    console.log(`Node backend running on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
