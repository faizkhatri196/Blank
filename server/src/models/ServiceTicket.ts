import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType, TicketPriority, TicketStatus } from '../types';

export interface IServiceTicket extends Document {
  companyId: mongoose.Types.ObjectId;
  ticketNumber: string;
  serviceType: ServiceType;
  customerId: mongoose.Types.ObjectId;
  assetId?: mongoose.Types.ObjectId;
  assetType?: 'SolarSystem' | 'ACUnit';
  complaint: string;
  rawComplaint?: string;
  normalizedComplaint?: string;
  isUnknownTriage?: boolean;
  triageClassification?: 'KNOWN_PROBLEM' | 'UNKNOWN_TRIAGE' | 'PERFORMANCE_ISSUE' | 'SAFETY_CRITICAL';
  environmentContext?: 'DEMO' | 'PILOT' | 'CLIENT';
  problemCategory?: string;
  problemCode?: string;
  serviceLocation?: {
    address: string;
    city: string;
    area?: string;
    pincode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    locationSource?: string;
  };
  serviceLocationSnapshot?: {
    inputText?: string;
    formattedAddress: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    provider?: string;
    placeId?: string;
    resolvedAt: Date;
  };
  customerFeedback?: {
    rating: number;
    comment?: string;
    onTime?: boolean;
    resolved?: boolean;
    submittedAt?: Date;
  };
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
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: {
    role: 'CUSTOMER' | 'SERVICE_MANAGER' | 'TECHNICIAN';
    userId?: mongoose.Types.ObjectId;
    name?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ServiceTicketSchema = new Schema<IServiceTicket>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    serviceType: {
      type: String,
      required: true,
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    assetId: { type: Schema.Types.ObjectId, refPath: 'assetType' },
    assetType: {
      type: String,
      enum: ['SolarSystem', 'ACUnit'],
    },
    serviceLocation: {
      address: { type: String, trim: true },
      city: { type: String, trim: true, index: true },
      area: { type: String, trim: true },
      pincode: { type: String, trim: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      locationSource: { type: String, default: 'MANUAL' },
    },
    serviceLocationSnapshot: {
      inputText: { type: String },
      formattedAddress: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      provider: { type: String, default: 'nominatim' },
      placeId: { type: String },
      resolvedAt: { type: Date, default: Date.now },
    },
    problemCategory: { type: String, trim: true },
    problemCode: { type: String, trim: true },
    customerFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      onTime: { type: Boolean },
      resolved: { type: Boolean },
      submittedAt: { type: Date },
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
      enum: ['DEMO', 'PILOT', 'CLIENT'],
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
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
    cancelledBy: {
      role: { type: String, enum: ['CUSTOMER', 'SERVICE_MANAGER', 'TECHNICIAN'] },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export const ServiceTicket = mongoose.model<IServiceTicket>('ServiceTicket', ServiceTicketSchema);
