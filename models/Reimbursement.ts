import mongoose, { Schema, Document } from 'mongoose';

export interface IReimbursement extends Document {
  applicationId: mongoose.Types.ObjectId; // Keeping applicationId for now as per summary, but referencing User
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  receiptUrl?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReimbursementSchema: Schema = new Schema({
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Updated reference
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  receiptUrl: {
    type: String
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IReimbursement>('Reimbursement', ReimbursementSchema);
