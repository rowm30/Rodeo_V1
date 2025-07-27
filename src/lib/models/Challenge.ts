import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  _id: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  nonce: string; // base64url encoded
  expiresAt: Date;
  consumedAt?: Date;
}

const ChallengeSchema = new Schema<IChallenge>({
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  consumedAt: {
    type: Date,
    required: false,
  },
});

// TTL index on expiresAt - MongoDB will automatically delete expired challenges
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for efficient queries
ChallengeSchema.index({ deviceId: 1, expiresAt: 1 });

export const Challenge =
  mongoose.models.Challenge ||
  mongoose.model<IChallenge>('Challenge', ChallengeSchema);
