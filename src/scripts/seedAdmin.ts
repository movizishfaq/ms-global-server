import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../db/connect.js';
import { User } from '../models/User.js';
import { generateUniqueReferralCode } from '../lib/referralCode.js';

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    process.exit(1);
  }
  await connectDb();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('Admin user already exists:', email);
    await disconnectDb();
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name: 'Platform Admin',
    role: 'admin',
    referralCode: await generateUniqueReferralCode('admin')
  });
  console.log('Created admin:', email);
  await disconnectDb();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
