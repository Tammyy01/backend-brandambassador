import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'phone' | 'email';
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['phone', 'email'],
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete document after expiration
  }
}, {
  timestamps: true
});

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);