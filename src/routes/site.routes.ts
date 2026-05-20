import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { SiteContent, SITE_DOC_KEY } from '../models/SiteContent.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

async function getOrCreateSiteDoc() {
  let doc = await SiteContent.findOne({ key: SITE_DOC_KEY });
  if (!doc) {
    doc = await SiteContent.create({
      key: SITE_DOC_KEY,
      publicDomain: '',
      draft: {},
      published: null
    });
  }
  return doc;
}

/** Public storefront — published snapshot only (no draft). */
router.get('/public', async (_req, res, next) => {
  try {
    const doc = await getOrCreateSiteDoc();
    const published = doc.published as Record<string, unknown> | null;
    if (!published || Object.keys(published).length === 0) {
      res.json({
        publishStatus: 'draft',
        publicDomain: doc.publicDomain,
        payload: null
      });
      return;
    }
    res.json({
      publishStatus: 'published',
      publicDomain: doc.publicDomain,
      payload: published
    });
  } catch (e) {
    next(e);
  }
});

router.use(requireAuth, requireRoles('admin'));

/** Owner studio — full draft workspace. */
router.get('/studio', async (_req, res, next) => {
  try {
    const doc = await getOrCreateSiteDoc();
    res.json({
      publicDomain: doc.publicDomain,
      draft: doc.draft,
      published: doc.published
    });
  } catch (e) {
    next(e);
  }
});

router.put(
  '/studio/draft',
  body('draft').isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid draft payload');
      }
      const doc = await getOrCreateSiteDoc();
      doc.draft = req.body.draft as Record<string, unknown>;
      await doc.save();
      res.json({ ok: true, updatedAt: doc.updatedAt });
    } catch (e) {
      next(e);
    }
  }
);

router.post('/studio/publish', async (req, res, next) => {
  try {
    const doc = await getOrCreateSiteDoc();
    const draft = doc.draft as Record<string, unknown>;
    if (!draft || Object.keys(draft).length === 0) {
      throw new ApiError(400, 'Nothing to publish — save a draft first');
    }
    doc.published = JSON.parse(JSON.stringify(draft));
    await doc.save();
    res.json({
      ok: true,
      publishedAt: doc.updatedAt,
      publicDomain: doc.publicDomain
    });
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/studio/domain',
  body('publicDomain').optional().trim().isLength({ max: 500 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }
      const doc = await getOrCreateSiteDoc();
      if (req.body.publicDomain !== undefined) {
        doc.publicDomain = String(req.body.publicDomain).trim();
      }
      await doc.save();
      res.json({ publicDomain: doc.publicDomain });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
