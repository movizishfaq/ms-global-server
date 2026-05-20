import { randomBytes } from 'crypto';
import { User } from '../models/User.js';

function slugBase(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12);
  return s.length >= 3 ? s : 'member';
}

export async function generateUniqueReferralCode(name: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = randomBytes(3).toString('hex');
    const code = `${slugBase(name)}${suffix}`;
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  return `ref${randomBytes(5).toString('hex')}`;
}
