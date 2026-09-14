/**
 * Run: npx tsx scripts/seed-admin.ts
 * Creates the initial admin user if it doesn't exist.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "encoder", "viewer"], default: "admin" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const existing = await User.findOne({ username: "admin" });
  if (existing) {
    console.log("ℹ️  Admin user already exists. Skipping.");
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@1234", 12);
  await User.create({
    username: "admin",
    password: hashedPassword,
    name: "System Administrator",
    role: "admin",
    isActive: true,
  });

  console.log("✅ Admin user created successfully!");
  console.log("   Username : admin");
  console.log("   Password : Admin@1234");
  console.log("   ⚠️  Please change this password after first login.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
