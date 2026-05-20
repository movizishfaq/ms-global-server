import mongoose, { Schema } from 'mongoose';

/** Single-tenant site document (id always `default`). */
export interface ISiteContent {
  key: string;
  publicDomain: string;
  draft: Record<string, unknown>;
  published: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const siteContentSchema = new Schema<ISiteContent>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    publicDomain: { type: String, default: '', trim: true, maxlength: 500 },
    draft: { type: Schema.Types.Mixed, required: true, default: {} },
    published: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

export const SiteContent = mongoose.model<ISiteContent>(
  'SiteContent',
  siteContentSchema
);

export const SITE_DOC_KEY = 'default';
