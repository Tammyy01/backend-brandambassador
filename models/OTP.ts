import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOTP extends Document {
  applicationId: Types.ObjectId;
  type: 'phone' | 'email';
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema: Schema = new Schema({
  applicationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'AmbassadorApplication',
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
    required: true 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  attempts: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Auto delete OTPs after expiry
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);