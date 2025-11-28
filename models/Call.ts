import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICall extends Document {
  applicationId: Types.ObjectId;
  contactId?: Types.ObjectId;
  date: Date;
  duration?: number;
  notes?: string;
  status: 'Initiated' | 'Completed' | 'Missed';
  createdAt: Date;
  updatedAt: Date;
}

const CallSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'AmbassadorApplication', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    date: { type: Date, default: Date.now },
    duration: { type: Number },
    notes: { type: String },
    status: { 
      type: String, 
      enum: ['Initiated', 'Completed', 'Missed'], 
      default: 'Initiated' 
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICall>('Call', CallSchema);
