const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 1,
        family: 4,
      }
    );

    console.log("MongoDB connected successfully");

    mongoose.connection.on(
      "error",
      (error) => {
        console.error(
          "MongoDB connection error:",
          error.message
        );
      }
    );

    mongoose.connection.on(
      "disconnected",
      () => {
        console.log(
          "MongoDB disconnected"
        );
      }
    );

    mongoose.connection.on(
      "reconnected",
      () => {
        console.log(
          "MongoDB reconnected"
        );
      }
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:"
    );

    console.error(error);

    process.exit(1);
  }
};

module.exports = connectDB;