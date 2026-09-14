import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType, TicketPriority, TicketStatus } from '../types';

export interface IServiceTicket extends Document {
  companyId: mongoose.Types.ObjectId;
  ticketNumber: string;
  serviceType: ServiceType;
  customerId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  assetType: 'SolarSystem' | 'ACUnit';
  complaint: string;
  rawComplaint?: string;
  normalizedComplaint?: string;
  isUnknownTriage?: boolean;
  triageClassification?: 'KNOWN_PROBLEM' | 'UNKNOWN_TRIAGE' | 'PERFORMANCE_ISSUE' | 'SAFETY_CRITICAL';
  environmentContext?: 'DEMO' | 'PILOT';
  symptoms: string[];
  errorCode?: string;
  priority: TicketPriority;
  photos: string[];
  status: TicketStatus;
  aiAnalysisId?: mongoose.Types.ObjectId;
  assignedTechnicianId?: mongoose.Types.ObjectId;
  repeatVisit: boolean;
  previousTicketId?: mongoose.Types.ObjectId;
  repeatVisitReason?: string;
  isDemoData: boolean;
  createdBy: mongoose.Types.ObjectId;
  statusHistory: Array<{
    status: TicketStatus;
    changedBy: mongoose.Types.ObjectId;
    timestamp: Date;
    note?: string;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceTicketSchema = new Schema<IServiceTicket>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    serviceType: {
      type: String,
      enum: ['SOLAR', 'AC'],
      required: true,
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    assetId: { type: Schema.Types.ObjectId, required: true, refPath: 'assetType' },
    assetType: {
      type: String,
      required: true,
      enum: ['SolarSystem', 'ACUnit'],
    },
    complaint: { type: String, required: true, trim: true },
    rawComplaint: { type: String, trim: true },
    normalizedComplaint: { type: String, trim: true },
    isUnknownTriage: { type: Boolean, default: false },
    triageClassification: {
      type: String,
      enum: ['KNOWN_PROBLEM', 'UNKNOWN_TRIAGE', 'PERFORMANCE_ISSUE', 'SAFETY_CRITICAL'],
      default: 'KNOWN_PROBLEM',
    },
    environmentContext: {
      type: String,
      enum: ['DEMO', 'PILOT'],
      default: 'DEMO',
      index: true,
    },
    symptoms: { type: [String], default: [] },
    errorCode: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    photos: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        'NEW',
        'AI_ANALYZED',
        'WAITING_FOR_ASSIGNMENT',
        'ASSIGNED',
        'ACCEPTED',
        'ON_THE_WAY',
        'ON_SITE',
        'DIAGNOSING',
        'REPAIRING',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'NEW',
      index: true,
    },
    aiAnalysisId: { type: Schema.Types.ObjectId, ref: 'AIAnalysis' },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'Technician', index: true },
    repeatVisit: { type: Boolean, default: false },
    previousTicketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket' },
    repeatVisitReason: { type: String },
    isDemoData: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const ServiceTicket = mongoose.model<IServiceTicket>('ServiceTicket', ServiceTicketSchema);
