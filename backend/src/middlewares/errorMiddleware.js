module.exports = (err, req, res, next) => {
  if (err?.code === 11000) {
    err.statusCode = 409;
    err.message = "The record already exists.";
  }
  if (err?.name === "CastError") {
    err.statusCode = 404;
    err.message = "Requested resource was not found.";
  }
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  if (process.env.NODE_ENV !== "production") {
    return res.status(status).json({ message, stack: err.stack });
  }
  return res.status(status).json({ message });
};
