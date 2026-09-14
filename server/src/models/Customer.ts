import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
