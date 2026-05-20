import mongoose, { Schema, Types } from 'mongoose';

export const OIL_CATEGORIES = [
  'coconut',
  'olive',
  'mustard',
  'herbal',
  'essential',
  'beard',
  'hair'
] as const;
export type OilCategory = (typeof OIL_CATEGORIES)[number];

export interface IProduct {
  sellerId: Types.ObjectId;
  name: string;
  oilCategory: OilCategory;
  priceCents: number;
  discountPriceCents: number | null;
  stock: number;
  description: string;
  images: string[];
  tags: string[];
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    oilCategory: {
      type: String,
      enum: OIL_CATEGORIES,
      required: true,
      index: true
    },
    priceCents: { type: Number, required: true, min: 0 },
    discountPriceCents: { type: Number, default: null, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, default: '', maxlength: 16000 },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    visible: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
