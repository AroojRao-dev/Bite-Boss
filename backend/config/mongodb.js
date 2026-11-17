import mongoose from "mongoose";

const connectDB = async () => {
  while (mongoose.connection.readyState !== 1) {
    try {
      if (mongoose.connection.readyState === 2) {
        await mongoose.connection.asPromise();
      } else {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          retryReads: true,
        });
      }

      console.log("MongoDB Connected ✅");
      return true;

    } catch (error) {
      console.error("MongoDB connection error ❌", error.message);
      console.log("Retrying MongoDB connection in 5 seconds... ⏳");

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  return true;
};

export default connectDB;