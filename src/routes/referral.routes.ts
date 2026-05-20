import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import {
  ReferralCommission,
  REFERRAL_COMMISSION_RATE
} from '../models/ReferralCommission.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { generateUniqueReferralCode } from '../lib/referralCode.js';

const router = Router();

async function ensureReferralCode(user: InstanceType<typeof User>) {
  if (user.referralCode) return user.referralCode;
  user.referralCode = await generateUniqueReferralCode(user.name);
  await user.save();
  return user.referralCode;
}

/** Stats for the signed-in member's referral program. */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, 'User not found');

    const referralCode = await ensureReferralCode(user);
    const totalReferrals = await User.countDocuments({ referredBy: user._id });

    const earnedAgg = await ReferralCommission.aggregate([
      { $match: { referrerId: user._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$commissionRp' } } }
    ]);
    const pendingAgg = await ReferralCommission.aggregate([
      { $match: { referrerId: user._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$commissionRp' } } }
    ]);

    res.json({
      referralCode,
      commissionRatePercent: Math.round(REFERRAL_COMMISSION_RATE * 100),
      totalReferrals,
      commissionEarnedRp: earnedAgg[0]?.total ?? 0,
      pendingCommissionRp: pendingAgg[0]?.total ?? 0
    });
  } catch (e) {
    next(e);
  }
});

/** Credit referrer when a referred member completes checkout. */
router.post(
  '/order-commission',
  body('orderId').trim().notEmpty().isLength({ max: 64 }),
  body('customerEmail').isEmail().normalizeEmail(),
  body('totalRp').isInt({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      const { orderId, customerEmail, totalRp } = req.body as {
        orderId: string;
        customerEmail: string;
        totalRp: number;
      };

      const existing = await ReferralCommission.findOne({ orderId });
      if (existing) {
        res.json({ recorded: false, reason: 'already_recorded' });
        return;
      }

      const buyer = await User.findOne({ email: customerEmail });
      if (!buyer?.referredBy) {
        res.json({ recorded: false, reason: 'no_referrer' });
        return;
      }

      const commissionRp = Math.round(totalRp * REFERRAL_COMMISSION_RATE);
      if (commissionRp <= 0) {
        res.json({ recorded: false, reason: 'zero_commission' });
        return;
      }

      await ReferralCommission.create({
        referrerId: buyer.referredBy,
        referredUserId: buyer._id,
        orderId,
        orderTotalRp: totalRp,
        commissionRp,
        status: 'pending'
      });

      res.status(201).json({ recorded: true, commissionRp });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
