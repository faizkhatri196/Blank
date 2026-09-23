import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType, TechnicianAvailability } from '../types';

export interface ITechnician extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  profilePhoto?: string;
  experienceYears: number;
  serviceTypes: ServiceType[];
  skills: string[];
  tools: string[];
  certifications: string[];
  serviceAreas: string[];
  baseLocation?: {
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    center?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  coverageRadiusKm?: number;
  pincodes?: string[];
  availability: TechnicianAvailability;
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    accuracy?: number;
    timestamp?: Date;
    lastActiveTicketId?: mongoose.Types.ObjectId;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianSchema = new Schema<ITechnician>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    profilePhoto: { type: String, default: '' },
    experienceYears: { type: Number, default: 1, min: 0 },
    serviceTypes: {
      type: [String],
      required: true,
      index: true,
    },
    skills: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    serviceAreas: { type: [String], default: [] },
    baseLocation: {
      formattedAddress: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      postalCode: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
      center: {
        type: Schema.Types.Mixed,
        default: undefined,
      },
    },
    coverageRadiusKm: { type: Number, default: 20 },
    pincodes: { type: [String], default: [] },
    availability: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true,
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      accuracy: { type: Number },
      timestamp: { type: Date },
      lastActiveTicketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket' },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Clean up invalid or empty center coordinates
TechnicianSchema.pre('validate', function (next) {
  if (this.baseLocation?.center) {
    const coords = this.baseLocation.center.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || (coords[0] === 0 && coords[1] === 0)) {
      this.baseLocation.center = undefined;
    }
  }
  next();
});

export const Technician = mongoose.model<ITechnician>('Technician', TechnicianSchema);
