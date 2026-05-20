import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Seller } from '../models/Seller.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));

router.get('/sellers/pending', async (_req, res, next) => {
  try {
    const sellers = await Seller.find({ approved: false })
      .sort({ createdAt: -1 })
      .populate('userId', 'email name');
    res.json({ sellers });
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/sellers/:sellerId',
  body('approved').isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      const sellerId = req.params?.sellerId;
      if (!sellerId || !Types.ObjectId.isValid(sellerId)) {
        throw new ApiError(400, 'Invalid seller id');
      }
      const seller = await Seller.findById(sellerId);
      if (!seller) throw new ApiError(404, 'Seller not found');
      seller.approved = Boolean(req.body.approved);
      await seller.save();
      res.json({ seller });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/stats', async (_req, res, next) => {
  try {
    const [users, sellers, products, pendingSellers] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments(),
      Seller.countDocuments({ approved: false })
    ]);
    res.json({
      totalUsers: users,
      totalSellers: sellers,
      totalProducts: products,
      pendingSellerApprovals: pendingSellers
    });
  } catch (e) {
    next(e);
  }
});

export default router;
