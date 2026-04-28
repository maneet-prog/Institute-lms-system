const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

const cloudEnabled =
  !!env.cloudinary.cloudName && !!env.cloudinary.apiKey && !!env.cloudinary.apiSecret;

if (cloudEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
}

const sanitizePathSegment = (segment) => String(segment).replace(/[^a-zA-Z0-9-_]/g, "_");

const buildFolderPath = (segments) =>
  segments
    .filter(Boolean)
    .map((segment) => sanitizePathSegment(segment))
    .join("/");

const uploadFile = async (file, segments = []) => {
  if (!file) return null;

  const normalizedSegments = Array.isArray(segments) ? segments : [segments];
  const folderPath = buildFolderPath(normalizedSegments);

  if (cloudEnabled) {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${env.cloudinary.folder}/${folderPath}`,
      resource_type: "auto"
    });
    return { fileUrl: result.secure_url, storageKey: `${result.resource_type}::${result.public_id}` };
  }

  const dir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fileName = `${Date.now()}-${sanitizePathSegment(file.originalname)}`;
  const fullPath = path.join(dir, fileName);
  fs.writeFileSync(fullPath, file.buffer);
  return { fileUrl: `/uploads/${fileName}`, storageKey: fileName };
};

const deleteFile = async (storageKey) => {
  if (!storageKey) return;

  if (cloudEnabled && storageKey.includes("::")) {
    const [resourceType, publicId] = storageKey.split("::");
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
    return;
  }

  const fullPath = path.join(process.cwd(), "uploads", storageKey);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

module.exports = { uploadFile, deleteFile };
