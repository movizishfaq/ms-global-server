import mongoose, { Schema, Types } from 'mongoose';

export interface ISeller {
  userId: Types.ObjectId;
  storeName: string;
  storeSlug: string;
  logoUrl: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  ratingAverage: number;
  ratingCount: number;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sellerSchema = new Schema<ISeller>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    storeName: { type: String, required: true, trim: true, maxlength: 160 },
    storeSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 8000 },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, default: '' },
    location: { type: String, default: '' },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    approved: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Seller = mongoose.model<ISeller>('Seller', sellerSchema);
