import dotenv from 'dotenv';

dotenv.config();

function envString(name: string, fallback?: string): string {
  const raw = process.env[name];
  const v = raw !== undefined && raw !== '' ? raw : fallback;
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

function parseOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ??
    [
      process.env.FRONTEND_URL,
      process.env.PUBLIC_SITE_URL,
      process.env.STUDIO_URL
    ]
      .filter(Boolean)
      .join(',');
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ['http://localhost:5173'];
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: envString(
    'MONGODB_URI',
    'mongodb://127.0.0.1:27017/ms-global-marketplace'
  ),
  jwtSecret: envString('JWT_SECRET', 'dev-only-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  publicSiteUrl:
    process.env.PUBLIC_SITE_URL ??
    process.env.FRONTEND_URL ??
    'http://localhost:5173',
  studioUrl:
    process.env.STUDIO_URL ?? 'http://localhost:5174',
  corsOrigins: parseOrigins()
};
