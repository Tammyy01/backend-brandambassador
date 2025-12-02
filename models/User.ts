import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  // Contact Information (collected during steps)
  phone?: string;
  email?: string;
  
  // Profile Information (merged from UserProfile)
  name?: string;
  linkedinUrl?: string;
  profileImage?: string;
  qrCodeData?: string;
  qrCodeGenerated?: boolean;
  isProfileCompleted: boolean;
  completedAt?: Date;

  // Verification Status
  phoneVerified: boolean;
  emailVerified: boolean;
  
  // Video Application
  videoUrl?: string;
  videoFilename?: string;
  videoUploaded: boolean;
  videoReviewStatus: 'pending' | 'approved' | 'rejected';
  
  // Application Status
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  
  // Progress Tracking (matches frontend Progress type)
  progress: {
    video: boolean;
    phone: boolean;
    email: boolean;
  };
  
  // Push Notifications
  pushSubscription?: any;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  phone: { type: String },
  email: { type: String },
  
  // Profile Fields
  name: { type: String },
  linkedinUrl: { type: String },
  profileImage: { type: String },
  qrCodeData: { type: String },
  qrCodeGenerated: { type: Boolean, default: false },
  isProfileCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },

  phoneVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  videoUrl: { type: String },
  videoFilename: { type: String },
  videoUploaded: { type: Boolean, default: false },
  videoReviewStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'draft'
  },
  progress: {
    video: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  pushSubscription: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ phone: 1 });
UserSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', UserSchema);