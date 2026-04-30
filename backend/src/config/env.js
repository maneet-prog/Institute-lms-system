const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lms_db",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "institute-lms"
  },
  defaultSuperAdminEmail: process.env.DEFAULT_SUPER_ADMIN_EMAIL || "admin@gmail.com",
  defaultSuperAdminPassword: process.env.DEFAULT_SUPER_ADMIN_PASSWORD || "Admin123",
  defaultSuperAdminFirstName: process.env.DEFAULT_SUPER_ADMIN_FIRST_NAME || "Super",
  defaultSuperAdminLastName: process.env.DEFAULT_SUPER_ADMIN_LAST_NAME || "Admin",
  defaultSuperAdminMobNo: process.env.DEFAULT_SUPER_ADMIN_MOB_NO || "9999999999",
  notificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.DEFAULT_SUPER_ADMIN_EMAIL || "admin@gmail.com",
  mail: {
    apiUrl: process.env.MAIL_API_URL || "",
    apiKey: process.env.MAIL_API_KEY || "",
    from: process.env.MAIL_FROM || "noreply@institutelms.local"
  },
  sms: {
    apiUrl: process.env.SMS_API_URL || "",
    apiKey: process.env.SMS_API_KEY || "",
    senderId: process.env.SMS_SENDER_ID || "LMSOTP"
  }
};
