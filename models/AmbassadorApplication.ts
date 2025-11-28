import mongoose, { Document, Schema } from 'mongoose';

export interface IAmbassadorApplication extends Document {
  // Contact Information (collected during steps)
  phone?: string;
  email?: string;
  
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

const AmbassadorApplicationSchema: Schema = new Schema({
  phone: { type: String },
  email: { type: String },
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

export default mongoose.model<IAmbassadorApplication>('AmbassadorApplication', AmbassadorApplicationSchema);