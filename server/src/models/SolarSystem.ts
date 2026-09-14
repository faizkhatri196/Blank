import mongoose, { Schema, Document } from 'mongoose';
import { SolarSystemType } from '../types';

export interface ISolarSystem extends Document {
  companyId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  capacityKW: number;
  panelMake: string;
  panelModel?: string;
  inverterMake: string;
  inverterModel?: string;
  inverterSerial?: string;
  systemType: SolarSystemType;
  batteryPresent: boolean;
  batteryDetails?: {
    brand?: string;
    capacityKWh?: number;
    voltage?: number;
  };
  installationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SolarSystemSchema = new Schema<ISolarSystem>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    capacityKW: { type: Number, required: true, min: 0.1 },
    panelMake: { type: String, required: true, trim: true },
    panelModel: { type: String, trim: true },
    inverterMake: { type: String, required: true, trim: true },
    inverterModel: { type: String, trim: true },
    inverterSerial: { type: String, trim: true, index: true },
    systemType: {
      type: String,
      enum: ['ON_GRID', 'OFF_GRID', 'HYBRID'],
      default: 'ON_GRID',
    },
    batteryPresent: { type: Boolean, default: false },
    batteryDetails: {
      brand: { type: String },
      capacityKWh: { type: Number },
      voltage: { type: Number },
    },
    installationDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const SolarSystem = mongoose.model<ISolarSystem>('SolarSystem', SolarSystemSchema);
