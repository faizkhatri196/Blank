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

export const Technician = mongoose.model<ITechnician>('Technician', TechnicianSchema);
