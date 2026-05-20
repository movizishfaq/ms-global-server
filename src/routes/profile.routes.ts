import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import {
  emptyOrganization,
  type IOrganizationProfile
} from '../models/OrganizationProfile.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function toOrganizationResponse(org: IOrganizationProfile | undefined) {
  return { organization: org ?? emptyOrganization() };
}

router.get('/organization', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, 'User not found');
    res.json(toOrganizationResponse(user.organization));
  } catch (e) {
    next(e);
  }
});

router.put(
  '/organization',
  requireAuth,
  body('organizationName').trim().notEmpty().isLength({ max: 160 }),
  body('legalName').optional().trim().isLength({ max: 160 }),
  body('registrationId').optional().trim().isLength({ max: 80 }),
  body('contactPhone').optional().trim().isLength({ max: 40 }),
  body('contactEmail').optional().isEmail().normalizeEmail(),
  body('website').optional().trim().isLength({ max: 500 }),
  body('addressLine').optional().trim().isLength({ max: 300 }),
  body('city').optional().trim().isLength({ max: 100 }),
  body('province').optional().trim().isLength({ max: 100 }),
  body('postalCode').optional().trim().isLength({ max: 20 }),
  body('country').optional().trim().isLength({ max: 80 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array().map((e) => e.msg).join(', '));
      }

      const user = await User.findById(req.user!.id);
      if (!user) throw new ApiError(404, 'User not found');

      const body = req.body as Partial<IOrganizationProfile>;
      user.organization = {
        organizationName: body.organizationName!.trim(),
        legalName: body.legalName?.trim() ?? '',
        registrationId: body.registrationId?.trim() ?? '',
        contactPhone: body.contactPhone?.trim() ?? '',
        contactEmail: body.contactEmail?.trim().toLowerCase() ?? user.email,
        website: body.website?.trim() ?? '',
        addressLine: body.addressLine?.trim() ?? '',
        city: body.city?.trim() ?? '',
        province: body.province?.trim() ?? '',
        postalCode: body.postalCode?.trim() ?? '',
        country: body.country?.trim() || 'Pakistan',
        description: body.description?.trim() ?? ''
      };
      await user.save();

      res.json(toOrganizationResponse(user.organization));
    } catch (e) {
      next(e);
    }
  }
);

export default router;
