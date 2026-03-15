import mongoose from "mongoose";
import { getEnv } from "@/lib/config/env";

/**
 * Cached connection singleton.
 * Prevents multiple connections in dev (hot-reload) and ensures
 * a single pool is reused across the application lifecycle.
 */

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectDB(): Promise<typeof mongoose> {
  if (globalWithMongoose._mongoosePromise) {
    return globalWithMongoose._mongoosePromise;
  }

  const { MONGODB_URI } = getEnv();

  globalWithMongoose._mongoosePromise = mongoose.connect(MONGODB_URI, {
    // Connection pool — max 10 connections shared across the app
    maxPoolSize: 10,
    // Timeout settings for production resilience
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  const conn = await globalWithMongoose._mongoosePromise;

  console.log("✅ MongoDB connected successfully");

  return conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  globalWithMongoose._mongoosePromise = undefined;
  console.log("🔌 MongoDB disconnected");
}
