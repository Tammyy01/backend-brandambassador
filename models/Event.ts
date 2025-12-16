import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  time?: string;
  location: string;
  image?: string;
  attendees: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const EventSchema: Schema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  attendees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export default mongoose.model<IEvent>('Event', EventSchema);
