import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Product, OIL_CATEGORIES, type OilCategory } from '../models/Product.js';
import { Seller } from '../models/Seller.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { escapeRegex } from '../lib/slugify.js';

const router = Router();

async function sellerForUser(userId: string) {
  return Seller.findOne({ userId: new Types.ObjectId(userId) });
}

/** Marketplace listing: approved sellers, visible products, filters. */
router.get(
  '/',
  query('q').optional().isString().isLength({ max: 120 }),
  query('category').optional().isIn([...OIL_CATEGORIES]),
  query('sellerId').optional().isMongoId(),
  query('minPrice').optional().isInt({ min: 0 }),
  query('maxPrice').optional().isInt({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid query parameters');
      }
      const approvedSellers = await Seller.find({ approved: true }).select('_id');
      const sellerIds = approvedSellers.map((s) => s._id);

      const filter: Record<string, unknown> = {
        sellerId: { $in: sellerIds },
        visible: true,
        stock: { $gt: 0 }
      };

      const query = req.query ?? {};
      const q = (query.q as string | undefined)?.trim();
      if (q) {
        filter.name = new RegExp(escapeRegex(q), 'i');
      }
      const category = query.category as OilCategory | undefined;
      if (category) filter.oilCategory = category;

      const sellerId = query.sellerId as string | undefined;
      if (sellerId) {
        const sid = new Types.ObjectId(sellerId);
        if (!sellerIds.some((id) => id.equals(sid))) {
          res.json({ products: [] });
          return;
        }
        filter.sellerId = sid;
      }

      const minPrice = query.minPrice ? Number(query.minPrice) : undefined;
      const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;
      if (minPrice !== undefined || maxPrice !== undefined) {
        const min = minPrice ?? 0;
        const max = maxPrice ?? 999_999_999;
        filter.$expr = {
          $and: [
            {
              $gte: [
                { $ifNull: ['$discountPriceCents', '$priceCents'] },
                min
              ]
            },
            {
              $lte: [
                { $ifNull: ['$discountPriceCents', '$priceCents'] },
                max
              ]
            }
          ]
        };
      }

      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('sellerId', 'storeName storeSlug logoUrl ratingAverage approved');

      res.json({ products });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/mine/list', requireAuth, requireRoles('seller'), async (req, res, next) => {
  try {
    const seller = await sellerForUser(req.user!.id);
    if (!seller) throw new ApiError(400, 'Create your seller profile first');
    const products = await Product.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  requireAuth,
  requireRoles('seller'),
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('oilCategory').isIn([...OIL_CATEGORIES]),
  body('priceCents').isInt({ min: 0 }),
  body('discountPriceCents').optional({ nullable: true }).isInt({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('description').optional().isString().isLength({ max: 16000 }),
  body('images').optional().isArray(),
  body('images.*').optional().isString().isLength({ max: 2000 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().isLength({ max: 40 }),
  body('visible').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      const seller = await sellerForUser(req.user!.id);
      if (!seller) throw new ApiError(400, 'Create your seller profile first');
      if (!seller.approved) {
        throw new ApiError(403, 'Seller account must be approved before listing products');
      }

      const {
        name,
        oilCategory,
        priceCents,
        discountPriceCents,
        stock,
        description,
        images,
        tags,
        visible
      } = req.body as {
        name: string;
        oilCategory: OilCategory;
        priceCents: number;
        discountPriceCents?: number | null;
        stock: number;
        description?: string;
        images?: string[];
        tags?: string[];
        visible?: boolean;
      };

      if (
        discountPriceCents != null &&
        discountPriceCents > 0 &&
        discountPriceCents >= priceCents
      ) {
        throw new ApiError(400, 'Discount price must be less than regular price');
      }

      const product = await Product.create({
        sellerId: seller._id,
        name,
        oilCategory,
        priceCents,
        discountPriceCents:
          discountPriceCents === undefined || discountPriceCents === null
            ? null
            : discountPriceCents,
        stock,
        description: description ?? '',
        images: images ?? [],
        tags: tags ?? [],
        visible: visible ?? true
      });
      res.status(201).json({ product });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id',
  requireAuth,
  requireRoles('seller'),
  body('name').optional().trim().notEmpty(),
  body('oilCategory').optional().isIn([...OIL_CATEGORIES]),
  body('priceCents').optional().isInt({ min: 0 }),
  body('discountPriceCents').optional({ nullable: true }).isInt({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('description').optional().isString(),
  body('images').optional().isArray(),
  body('tags').optional().isArray(),
  body('visible').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new ApiError(400, 'Invalid product id');
      }
      const seller = await sellerForUser(req.user!.id);
      if (!seller) throw new ApiError(400, 'Create your seller profile first');

      const product = await Product.findById(req.params.id);
      if (!product) throw new ApiError(404, 'Product not found');
      if (!product.sellerId.equals(seller._id)) {
        throw new ApiError(403, 'You can only edit your own products');
      }

      const patch = req.body as Partial<{
        name: string;
        oilCategory: OilCategory;
        priceCents: number;
        discountPriceCents: number | null;
        stock: number;
        description: string;
        images: string[];
        tags: string[];
        visible: boolean;
      }>;

      Object.assign(product, patch);
      if (patch.discountPriceCents === null) product.discountPriceCents = null;
      if (
        product.discountPriceCents != null &&
        product.discountPriceCents >= product.priceCents
      ) {
        throw new ApiError(400, 'Discount price must be less than regular price');
      }
      await product.save();
      res.json({ product });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  requireRoles('seller'),
  async (req, res, next) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new ApiError(400, 'Invalid product id');
      }
      const seller = await sellerForUser(req.user!.id);
      if (!seller) throw new ApiError(400, 'Create your seller profile first');

      const product = await Product.findById(req.params.id);
      if (!product) throw new ApiError(404, 'Product not found');
      if (!product.sellerId.equals(seller._id)) {
        throw new ApiError(403, 'You can only delete your own products');
      }
      await product.deleteOne();
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new ApiError(400, 'Invalid product id');
    }
    const product = await Product.findById(req.params.id).populate(
      'sellerId',
      'storeName storeSlug logoUrl ratingAverage approved contactEmail'
    );
    if (!product) throw new ApiError(404, 'Product not found');
    const seller = product.sellerId as unknown as { approved?: boolean } | null;
    if (!seller || !seller.approved) throw new ApiError(404, 'Product not found');
    if (!product.visible || product.stock <= 0) {
      throw new ApiError(404, 'Product not available');
    }
    res.json({ product });
  } catch (e) {
    next(e);
  }
});

export default router;
