import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType, UserRole } from '../types';

export interface IPilotFeedback extends Document {
  companyId: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: UserRole;
  serviceType: ServiceType;
  aiUtilityRating: number; // 1-5
  wasAiSuggestionUseful?: 'YES' | 'PARTIALLY' | 'NO';
  didTechnicianHaveRequiredTools?: 'YES' | 'NO';
  wasSecondVisitRequired?: 'YES' | 'NO';
  secondVisitReason?: string;
  additionalFeedback?: string;
  diagnosisHelpfulness?: number; // 1-5
  toolHelpfulness?: number; // 1-5
  partsHelpfulness?: number; // 1-5
  technicianMatchingHelpfulness?: number; // 1-5
  timeSavedMinutes?: number;
  comments?: string;
  createdAt: Date;
}

const PilotFeedbackSchema = new Schema<IPilotFeedback>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['SERVICE_MANAGER', 'TECHNICIAN'], required: true },
    serviceType: { type: String, enum: ['SOLAR', 'AC'], required: true, index: true },
    aiUtilityRating: { type: Number, required: true, min: 1, max: 5 },
    wasAiSuggestionUseful: { type: String, enum: ['YES', 'PARTIALLY', 'NO'] },
    didTechnicianHaveRequiredTools: { type: String, enum: ['YES', 'NO'] },
    wasSecondVisitRequired: { type: String, enum: ['YES', 'NO'] },
    secondVisitReason: { type: String, default: '' },
    additionalFeedback: { type: String, default: '' },
    diagnosisHelpfulness: { type: Number, min: 1, max: 5 },
    toolHelpfulness: { type: Number, min: 1, max: 5 },
    partsHelpfulness: { type: Number, min: 1, max: 5 },
    technicianMatchingHelpfulness: { type: Number, min: 1, max: 5 },
    timeSavedMinutes: { type: Number },
    comments: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PilotFeedback = mongoose.model<IPilotFeedback>('PilotFeedback', PilotFeedbackSchema);
