import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  _id: mongoose.Types.ObjectId;
  publicKeyJwk: JsonWebKey;
  publicKeyThumbprint: string;
  createdAt: Date;
  lastSeenAt: Date;
  status: 'active' | 'locked' | 'revoked';
  failedAttempts: number;
  displayName?: string;
  lastIp?: string;
  userAgent?: string;
}

const DeviceSchema = new Schema<IDevice>({
  publicKeyJwk: {
    type: Schema.Types.Mixed,
    required: true,
  },
  publicKeyThumbprint: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'locked', 'revoked'],
    default: 'active',
    index: true,
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
  displayName: {
    type: String,
    required: false,
  },
  lastIp: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },
});

// Compound indexes
DeviceSchema.index({ status: 1 });
DeviceSchema.index({ publicKeyThumbprint: 1 }, { unique: true });

export const Device =
  mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
