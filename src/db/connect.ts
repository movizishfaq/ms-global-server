import mongoose from 'mongoose';
import { env } from '../config/env.js';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null
};
if (!global.mongooseCache) global.mongooseCache = cache;

export async function connectDb(): Promise<void> {
  if (cache.conn) return;
  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose.connect(env.mongoUri);
  }
  cache.conn = await cache.promise;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
