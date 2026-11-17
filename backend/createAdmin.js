import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection.db;
const users = db.collection("users");

const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error("ADMIN_PASSWORD is missing");
}

const hashed = await bcrypt.hash(adminPassword, 10);

await users.updateOne(
  { email: "admin@biteboss.com" },
  { $set: { password: hashed } }
);

console.log("✅ Admin password updated!");
await mongoose.disconnect();
