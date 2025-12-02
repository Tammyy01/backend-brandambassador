import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  applicationId: mongoose.Types.ObjectId; // Keeping applicationId for now as per summary, but referencing User
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
  avatar?: string;
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
  role: {
    type: String
  },
  notes: {
    type: String
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

// Index for search
ContactSchema.index({ name: 'text', company: 'text', role: 'text' });

export default mongoose.model<IContact>('Contact', ContactSchema);