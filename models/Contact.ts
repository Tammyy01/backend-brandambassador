import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IContact extends Document {
  applicationId: Types.ObjectId
  name: string
  company?: string
  avatar?: string
  event?: string
  note?: string
  phone?: string
  email?: string
  address?: string
  linkedinUrl?: string
  starred: boolean
  createdAt: Date
  updatedAt: Date
}

const ContactSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'AmbassadorApplication', required: true, index: true },
    name: { type: String, required: true },
    company: { type: String },
    avatar: { type: String },
    event: { type: String },
    note: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    linkedinUrl: { type: String },
    starred: { type: Boolean, default: false }
  },
  { timestamps: true }
)

ContactSchema.index({ name: 'text', company: 'text', event: 'text', note: 'text', address: 'text', linkedinUrl: 'text' })

export default mongoose.model<IContact>('Contact', ContactSchema)