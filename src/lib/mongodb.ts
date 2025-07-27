import { MongoClient, MongoClientOptions } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

// ---- Global typings for Node (avoid HMR re-init in dev) ----
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoose: MongooseCache | undefined;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// ---- MongoDB native client (for general usage) ----
let clientPromise: Promise<MongoClient>;
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise!;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// ---- Mongoose connection (for your Mongoose models) ----
const mongooseCache: MongooseCache =
  global._mongoose ?? (global._mongoose = { conn: null, promise: null });

export async function connectToDatabase() {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    const opts = { bufferCommands: false };
    mongooseCache.promise = mongoose.connect(uri, opts);
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
  } catch (e) {
    mongooseCache.promise = null;
    throw e;
  }

  return mongooseCache.conn;
}

export default clientPromise;
