import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType } from '../types';

export interface ICompany extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  approvedContactNumber?: string;
  servicesSupported: ServiceType[];
  serviceAreas: Array<{
    city: string;
    state?: string;
    country?: string;
    areas?: string[];
    pincodes?: string[];
    latitude?: number;
    longitude?: number;
    radius?: number;
    services: ServiceType[];
  }>;
  settings: {
    allowBlindEvaluation?: boolean;
    defaultCurrency?: string;
    showTechnicianNameToCustomer?: boolean;
    showApprovedContactToCustomer?: boolean;
  };
  isPilot: boolean;
  environmentContext: 'DEMO' | 'PILOT' | 'CLIENT';
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
    approvedContactNumber: { type: String, trim: true },
    servicesSupported: {
      type: [String],
      default: ['SOLAR', 'AC'],
    },
    serviceAreas: [
      {
        city: { type: String, required: true, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true, default: 'India' },
        areas: { type: [String], default: [] },
        pincodes: { type: [String], default: [] },
        latitude: { type: Number },
        longitude: { type: Number },
        radius: { type: Number },
        services: { type: [String], default: ['SOLAR', 'AC'] },
      },
    ],
    settings: {
      allowBlindEvaluation: { type: Boolean, default: true },
      defaultCurrency: { type: String, default: 'INR' },
      showTechnicianNameToCustomer: { type: Boolean, default: false },
      showApprovedContactToCustomer: { type: Boolean, default: true },
    },
    isPilot: { type: Boolean, default: false, index: true },
    environmentContext: {
      type: String,
      enum: ['DEMO', 'PILOT', 'CLIENT'],
      default: 'DEMO',
      index: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
