import mongoose, { Schema, Document } from 'mongoose';
import { ACUnitType } from '../types';

export interface IACUnit {
  companyId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  brand: string;
  model?: string;
  serialNumber?: string;
  acType: ACUnitType;
  capacityTR: number;
  refrigerantType?: string;
  installationType?: string;
  compressorType?: 'INVERTER' | 'NON_INVERTER' | 'ROTARY' | 'SCROLL';
  installationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ACUnitSchema = new Schema<IACUnit>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true, index: true },
    acType: {
      type: String,
      enum: ['SPLIT', 'WINDOW', 'CASSETTE', 'DUCTED', 'OTHER'],
      default: 'SPLIT',
    },
    capacityTR: { type: Number, required: true, min: 0.5 },
    refrigerantType: { type: String, default: 'R32' },
    installationType: { type: String, default: 'RESIDENTIAL' },
    compressorType: {
      type: String,
      enum: ['INVERTER', 'NON_INVERTER', 'ROTARY', 'SCROLL'],
      default: 'INVERTER',
    },
    installationDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ACUnit = mongoose.model<IACUnit>('ACUnit', ACUnitSchema);
