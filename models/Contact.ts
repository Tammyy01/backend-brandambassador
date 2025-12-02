import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  applicationId: mongoose.Types.ObjectId; // Keeping applicationId for now as per summary, but referencing User
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  note?: string;
  avatar?: string;
  address?: string;
  event?: string;
  linkedinUrl?: string;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Updated reference
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  company: {
    type: String
  },
  title: {
    type: String
  },
  note: {
    type: String
  },
  avatar: {
    type: String
  },
  address: {
    type: String
  },
  event: {
    type: String
  },
  linkedinUrl: {
    type: String
  },
  starred: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search
ContactSchema.index({ name: 'text', company: 'text', title: 'text', note: 'text', event: 'text' });

export default mongoose.model<IContact>('Contact', ContactSchema);