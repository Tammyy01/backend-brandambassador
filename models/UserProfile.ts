import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserProfile extends Document {
  // Link to ambassador application
  applicationId: Types.ObjectId;
  
  // Profile information from CompleteProfile form
  name: string;
  email: string;
  linkedinUrl?: string;
  profileImage?: string;
  
  // QR Code data
  qrCodeData: string;
  qrCodeGenerated: boolean;
  
  // Status
  isProfileCompleted: boolean;
  completedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema({
  applicationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'AmbassadorApplication',
    required: true,
    unique: true
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  linkedinUrl: { 
    type: String 
  },
  profileImage: { 
    type: String 
  },
  qrCodeData: { 
    type: String, 
    required: true 
  },
  qrCodeGenerated: { 
    type: Boolean, 
    default: false 
  },
  isProfileCompleted: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date 
  }
}, {
  timestamps: true
});

// Index for faster queries
UserProfileSchema.index({ applicationId: 1 });
UserProfileSchema.index({ isProfileCompleted: 1 });

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);