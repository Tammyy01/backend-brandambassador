import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  applicationId: mongoose.Types.ObjectId;
  type: 'event' | 'reimbursement' | 'info' | 'system';
  title: string;
  description: string;
  read: boolean;
  metadata?: any; // For linking to specific events or reimbursements
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'AmbassadorApplication', required: true },
  type: { 
    type: String, 
    enum: ['event', 'reimbursement', 'info', 'system'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  read: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
