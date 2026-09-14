import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType, PossibleIssue } from '../types';

export interface IAIAnalysis {
  ticketId: mongoose.Types.ObjectId;
  provider: string;
  model: string;
  serviceType: ServiceType;
  possibleIssues: PossibleIssue[];
  diagnosticSteps: string[];
  recommendedTools: string[];
  possibleParts: string[];
  safetyWarnings: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  knowledgeSources: string[];
  promptVersion: string;
  createdAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket', index: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    serviceType: {
      type: String,
      enum: ['SOLAR', 'AC'],
      required: true,
    },
    possibleIssues: [
      {
        issue: { type: String, required: true },
        probabilityLevel: {
          type: String,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          default: 'MEDIUM',
        },
        explanation: { type: String, required: true },
      },
    ],
    diagnosticSteps: { type: [String], default: [] },
    recommendedTools: { type: [String], default: [] },
    possibleParts: { type: [String], default: [] },
    safetyWarnings: { type: [String], default: [] },
    confidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    reasoning: { type: String, default: '' },
    knowledgeSources: { type: [String], default: [] },
    promptVersion: { type: String, default: 'v0.1' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AIAnalysis = mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
