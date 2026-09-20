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
    _id?: any;
    locationName?: string;
    formattedAddress?: string;
    city: string;
    state?: string;
    country?: string;
    postalCode?: string;
    areas?: string[];
    pincodes?: string[];
    latitude?: number;
    longitude?: number;
    center?: {
      type: 'Point';
      coordinates: [number, number];
    };
    radius?: number;
    radiusKm?: number;
    services: ServiceType[];
    active?: boolean;
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
        locationName: { type: String, trim: true },
        formattedAddress: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true, default: 'India' },
        postalCode: { type: String, trim: true },
        areas: { type: [String], default: [] },
        pincodes: { type: [String], default: [] },
        latitude: { type: Number },
        longitude: { type: Number },
        center: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], default: [0, 0] },
        },
        radius: { type: Number, default: 20 },
        radiusKm: { type: Number, default: 20 },
        services: { type: [String], default: ['SOLAR', 'AC'] },
        active: { type: Boolean, default: true },
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

CompanySchema.index({ 'serviceAreas.center': '2dsphere' });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
