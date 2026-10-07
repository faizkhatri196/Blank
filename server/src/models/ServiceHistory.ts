import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType } from '../types';

export interface IServiceHistory extends Document {
  companyId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  assetId?: mongoose.Types.ObjectId;
  assetType?: 'SolarSystem' | 'ACUnit';
  serviceType: ServiceType;
  ticketId: mongoose.Types.ObjectId;
  ticketNumber: string;
  complaint: string;
  aiPredictionSummary: string;
  actualDiagnosis: string;
  workPerformed: string;
  partsUsed: string[];
  readings: Record<string, any>;
  technicianName: string;
  comparisonResult?: {
    diagnosisMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH';
    toolMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH';
    partMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' | 'NOT APPLICABLE';
  };
  completedAt: Date;
  createdAt: Date;
}

const ServiceHistorySchema = new Schema<IServiceHistory>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    assetId: { type: Schema.Types.ObjectId, required: false, refPath: 'assetType', index: true },
    assetType: {
      type: String,
      required: false,
      enum: ['SolarSystem', 'ACUnit'],
    },
    serviceType: {
      type: String,
      required: true,
      index: true,
    },
    ticketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket', required: true, index: true },
    ticketNumber: { type: String, required: true },
    complaint: { type: String, required: true },
    aiPredictionSummary: { type: String, default: '' },
    actualDiagnosis: { type: String, required: true },
    workPerformed: { type: String, required: true },
    partsUsed: { type: [String], default: [] },
    readings: { type: Schema.Types.Mixed, default: {} },
    technicianName: { type: String, required: true },
    comparisonResult: {
      diagnosisMatch: { type: String, enum: ['MATCH', 'PARTIAL MATCH', 'NO MATCH'], default: 'MATCH' },
      toolMatch: { type: String, enum: ['MATCH', 'PARTIAL MATCH', 'NO MATCH'], default: 'MATCH' },
      partMatch: { type: String, enum: ['MATCH', 'PARTIAL MATCH', 'NO MATCH', 'NOT APPLICABLE'], default: 'MATCH' },
    },
    completedAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ServiceHistory = mongoose.model<IServiceHistory>('ServiceHistory', ServiceHistorySchema);
