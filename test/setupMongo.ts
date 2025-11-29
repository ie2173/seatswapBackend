import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer | null = null;

/**
 * Connect to in-memory MongoDB for testing
 */
export async function connectTestDB() {
  // If already connected, disconnect first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect mongoose to the in-memory server
  await mongoose.connect(uri);
}

/**
 * Clear all collections in the test database
 */
export async function clearTestDB() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      // Drop the collection entirely to reset indexes and avoid unique constraint issues
      await collections[key]!.drop().catch(() => {
        // Ignore errors if collection doesn't exist
      });
    }
  }
}

/**
 * Disconnect and stop the in-memory MongoDB server
 */
export async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}
