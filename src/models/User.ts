import mongoose, { Schema, Types } from 'mongoose';
import {
  emptyOrganization,
  organizationProfileSchema,
  type IOrganizationProfile
} from './OrganizationProfile.js';

export const USER_ROLES = ['buyer', 'seller', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  referralCode?: string;
  referredBy?: Types.ObjectId;
  organization?: IOrganizationProfile;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    organization: {
      type: organizationProfileSchema,
      default: () => emptyOrganization()
    }
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const o = ret as unknown as Record<string, unknown>;
    delete o.passwordHash;
    delete o.__v;
    return o;
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
