import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, type UserRole } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { generateUniqueReferralCode } from '../lib/referralCode.js';

const router = Router();

router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('role').isIn(['buyer', 'seller']),
  body('referralCode').optional().trim().isLength({ min: 3, max: 32 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      const { email, password, name, role, referralCode } = req.body as {
        email: string;
        password: string;
        name: string;
        role: UserRole;
        referralCode?: string;
      };
      const exists = await User.findOne({ email });
      if (exists) throw new ApiError(409, 'Email already registered');

      let referredBy: Types.ObjectId | undefined;
      if (referralCode) {
        const referrer = await User.findOne({
          referralCode: referralCode.toLowerCase()
        });
        if (referrer) referredBy = referrer._id;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const code = await generateUniqueReferralCode(name);
      const user = await User.create({
        email,
        passwordHash,
        name,
        role,
        referralCode: code,
        referredBy: referredBy ?? null
      });
      const token = signToken(user.id, user.role);
      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid credentials payload');
      }
      const { email, password } = req.body as { email: string; password: string };
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) throw new ApiError(401, 'Invalid email or password');
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new ApiError(401, 'Invalid email or password');
      const token = signToken(user.id, user.role);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, 'User not found');
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
