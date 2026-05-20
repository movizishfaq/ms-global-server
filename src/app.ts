import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDb } from './db/connect.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import productRoutes from './routes/product.routes.js';
import adminRoutes from './routes/admin.routes.js';
import referralRoutes from './routes/referral.routes.js';
import profileRoutes from './routes/profile.routes.js';
import siteRoutes from './routes/site.routes.js';

export function createApp() {
  const app = express();

  app.use(async (_req, _res, next) => {
    try {
      await connectDb();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true
    })
  );
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/sellers', sellerRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/referrals', referralRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/site', siteRoutes);

  app.use(errorHandler);
  return app;
}

/** Vercel zero-config Express entry (see vercel.com/docs/frameworks/backend/express) */
export default createApp();
