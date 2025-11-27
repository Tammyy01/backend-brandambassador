import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  date: Date;
  time: string;
  description: string;
  location: string;
  image: string;
  attendees: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'AmbassadorApplication' }], // Assuming attendees are linked to the application/user
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
