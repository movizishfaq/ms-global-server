import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Seller } from '../models/Seller.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { slugify } from '../lib/slugify.js';

const router = Router();

/** Public store card (approved sellers only). */
router.get('/public/:slug', async (req, res, next) => {
  try {
    const seller = await Seller.findOne({
      storeSlug: req.params.slug,
      approved: true
    });
    if (!seller) throw new ApiError(404, 'Store not found');
    res.json({ seller });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, requireRoles('seller'), async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user!.id });
    res.json({ seller: seller ?? null });
  } catch (e) {
    next(e);
  }
});

router.put(
  '/me',
  requireAuth,
  requireRoles('seller'),
  body('storeName').trim().notEmpty().isLength({ max: 160 }),
  body('contactEmail').isEmail().normalizeEmail(),
  body('contactPhone').optional().isString().isLength({ max: 40 }),
  body('location').optional().isString().isLength({ max: 200 }),
  body('description').optional().isString().isLength({ max: 8000 }),
  body('logoUrl').optional().isString().isLength({ max: 2000 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      const { storeName, contactEmail, contactPhone, location, description, logoUrl } =
        req.body as Record<string, string>;

      let seller = await Seller.findOne({ userId: req.user!.id });
      const baseSlug = slugify(storeName);
      let storeSlug = baseSlug;
      const userObjectId = new Types.ObjectId(req.user!.id);

      if (!seller) {
        let n = 0;
        while (await Seller.findOne({ storeSlug })) {
          n += 1;
          storeSlug = `${baseSlug}-${n}`;
        }
        seller = await Seller.create({
          userId: userObjectId,
          storeName,
          storeSlug,
          logoUrl: logoUrl ?? '',
          description: description ?? '',
          contactEmail,
          contactPhone: contactPhone ?? '',
          location: location ?? '',
          approved: false
        });
      } else {
        const wanted = slugify(storeName);
        if (wanted !== seller.storeSlug) {
          let candidate = wanted;
          let n = 0;
          while (
            await Seller.findOne({
              storeSlug: candidate,
              _id: { $ne: seller._id }
            })
          ) {
            n += 1;
            candidate = `${wanted}-${n}`;
          }
          seller.storeSlug = candidate;
        }
        seller.storeName = storeName;
        seller.contactEmail = contactEmail;
        seller.contactPhone = contactPhone ?? '';
        seller.location = location ?? '';
        seller.description = description ?? '';
        if (logoUrl !== undefined) seller.logoUrl = logoUrl;
        await seller.save();
      }
      res.json({ seller });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
