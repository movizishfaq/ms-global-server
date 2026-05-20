import mongoose, { Schema, Types } from 'mongoose';

export const COMMISSION_STATUSES = ['pending', 'paid'] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const REFERRAL_COMMISSION_RATE = 0.1;

export interface IReferralCommission {
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  orderId: string;
  orderTotalRp: number;
  commissionRp: number;
  status: CommissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const referralCommissionSchema = new Schema<IReferralCommission>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderId: { type: String, required: true, unique: true, trim: true },
    orderTotalRp: { type: Number, required: true, min: 0 },
    commissionRp: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      default: 'pending',
      index: true
    }
  },
  { timestamps: true }
);

export const ReferralCommission = mongoose.model<IReferralCommission>(
  'ReferralCommission',
  referralCommissionSchema
);
