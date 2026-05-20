import { Schema } from 'mongoose';

export interface IOrganizationProfile {
  organizationName: string;
  legalName: string;
  registrationId: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  description: string;
}

export const organizationProfileSchema = new Schema<IOrganizationProfile>(
  {
    organizationName: { type: String, default: '', trim: true, maxlength: 160 },
    legalName: { type: String, default: '', trim: true, maxlength: 160 },
    registrationId: { type: String, default: '', trim: true, maxlength: 80 },
    contactPhone: { type: String, default: '', trim: true, maxlength: 40 },
    contactEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
    website: { type: String, default: '', trim: true, maxlength: 500 },
    addressLine: { type: String, default: '', trim: true, maxlength: 300 },
    city: { type: String, default: '', trim: true, maxlength: 100 },
    province: { type: String, default: '', trim: true, maxlength: 100 },
    postalCode: { type: String, default: '', trim: true, maxlength: 20 },
    country: { type: String, default: 'Pakistan', trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 2000 }
  },
  { _id: false }
);

export const emptyOrganization = (): IOrganizationProfile => ({
  organizationName: '',
  legalName: '',
  registrationId: '',
  contactPhone: '',
  contactEmail: '',
  website: '',
  addressLine: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Pakistan',
  description: ''
});
