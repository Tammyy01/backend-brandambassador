import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  applicationId: mongoose.Types.ObjectId; // Keeping applicationId for now as per summary, but referencing User
  contactId: mongoose.Types.ObjectId;
  duration: number;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CallSchema: Schema = new Schema({
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Updated reference
    required: true
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ICall>('Call', CallSchema);
