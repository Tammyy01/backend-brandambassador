import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReimbursement extends Document {
  applicationId: Types.ObjectId;
  event: string;
  date: Date;
  expenseType: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  receiptImage?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReimbursementSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'AmbassadorApplication', required: true, index: true },
    event: { type: String, required: true },
    date: { type: Date, required: true },
    expenseType: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Paid', 'Rejected'], 
      default: 'Pending' 
    },
    receiptImage: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IReimbursement>('Reimbursement', ReimbursementSchema);
