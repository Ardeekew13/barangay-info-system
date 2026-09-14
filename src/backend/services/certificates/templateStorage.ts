import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

const BUCKET_NAME = "certificateTemplates";

async function getBucket() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not ready");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export async function saveTemplateFile(buffer: Buffer, filename: string): Promise<mongoose.Types.ObjectId> {
  const bucket = await getBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id as mongoose.Types.ObjectId));
    uploadStream.end(buffer);
  });
}

export async function loadTemplateFile(fileId: mongoose.Types.ObjectId | string): Promise<Buffer> {
  const bucket = await getBucket();
  const id = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on("data", (chunk) => chunks.push(chunk));
    downloadStream.on("error", reject);
    downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function deleteTemplateFile(fileId: mongoose.Types.ObjectId | string): Promise<void> {
  const bucket = await getBucket();
  const id = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
  await bucket.delete(id);
}
