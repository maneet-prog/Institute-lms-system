const mongoose = require("mongoose");
const env = require("./env");

const connectDb = async () => {
  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 20
  });
};

module.exports = { connectDb };
