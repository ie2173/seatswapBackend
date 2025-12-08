import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/seatswap";
    console.log("DEBUG - MONGODB_URI env var:", process.env.MONGODB_URI ? "Set" : "NOT SET");
    console.log("DEBUG - Using mongoUri:", mongoUri.substring(0, 20) + "...");
    await mongoose.connect(mongoUri);
    console.log(
      "MongoDB connected successfully to:",
      mongoUri.split("@")[1] || mongoUri
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
