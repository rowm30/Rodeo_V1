import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  deviceId: mongoose.Types.ObjectId;
  publicId: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true,
    },
    publicId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

UserSchema.index({ publicId: 1 }, { unique: true });
UserSchema.index({ displayName: 1 }, { unique: true });
UserSchema.index({ deviceId: 1 });

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
