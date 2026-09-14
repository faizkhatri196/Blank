import mongoose, { Schema, Document } from 'mongoose';
import { SolarReadings, ACReadings } from '../types';

export interface IServiceReport extends Document {
  ticketId: mongoose.Types.ObjectId;
  technicianId: mongoose.Types.ObjectId;
  actualDiagnosis: string;
  workPerformed: string;
  readings: SolarReadings & ACReadings;
  partsUsed: string[];
  toolsUsed: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  technicianNotes?: string;
  aiHelpful?: boolean;
  aiAccuracyRating?: number;
  toolsHelpful?: boolean;
  partsHelpful?: boolean;
  additionalFeedback?: string;
  customerConfirmation?: boolean;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceReportSchema = new Schema<IServiceReport>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket', required: true, unique: true, index: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'Technician', required: true, index: true },
    actualDiagnosis: { type: String, required: true, trim: true },
    workPerformed: { type: String, required: true, trim: true },
    readings: { type: Schema.Types.Mixed, default: {} },
    partsUsed: { type: [String], default: [] },
    toolsUsed: { type: [String], default: [] },
    beforePhotos: { type: [String], default: [] },
    afterPhotos: { type: [String], default: [] },
    technicianNotes: { type: String, default: '' },
    aiHelpful: { type: Boolean },
    aiAccuracyRating: { type: Number, min: 1, max: 5 },
    toolsHelpful: { type: Boolean },
    partsHelpful: { type: Boolean },
    additionalFeedback: { type: String, default: '' },
    customerConfirmation: { type: Boolean, default: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ServiceReport = mongoose.model<IServiceReport>('ServiceReport', ServiceReportSchema);
