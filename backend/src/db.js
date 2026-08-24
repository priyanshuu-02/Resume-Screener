import mongoose from "mongoose";
import config from "./config.js";

export async function connectDB() {
  try {
    const dbName = process.env.DB_NAME || "lucent_resumer_screener";
    await mongoose.connect(config.mongoUri, { dbName });
    console.log(`✅  MongoDB connected to database "${dbName}": ${mongoose.connection.host}`);
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
