import type { IncomingMessage, ServerResponse } from 'node:http';
import { connectDb } from '../src/db/connect.js';
import { createApp } from '../src/app.js';

const app = createApp();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  await connectDb();
  app(req, res);
}
