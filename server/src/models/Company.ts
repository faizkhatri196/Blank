import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType } from '../types';

export interface ICompany extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  servicesSupported: ServiceType[];
  settings: {
    allowBlindEvaluation?: boolean;
    defaultCurrency?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    servicesSupported: {
      type: [String],
      enum: ['SOLAR', 'AC'],
      default: ['SOLAR', 'AC'],
    },
    settings: {
      allowBlindEvaluation: { type: Boolean, default: true },
      defaultCurrency: { type: String, default: 'INR' },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
