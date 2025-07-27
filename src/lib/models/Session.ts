import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  ip?: string;
  userAgent?: string;
  refreshTokenHash?: string;
}

const SessionSchema = new Schema<ISession>({
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  revokedAt: {
    type: Date,
    required: false,
  },
  ip: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },
  refreshTokenHash: {
    type: String,
    required: false,
  },
});

// TTL index on expiresAt - MongoDB will automatically delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for efficient queries
SessionSchema.index({ deviceId: 1, expiresAt: 1 });

export const Session =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
