import mongoose, { Schema, Document } from 'mongoose';
import { DataType, ServiceType } from '../types';

export interface IEvaluationCase extends Document {
  caseId: string;
  dataType: DataType;
  sourceOrganization: string;
  sourceUrl: string;
  sourceDate?: string;
  locationContext: string;
  problem: string;
  observedInput: string;
  publishedSolution: string;
  groundTruth: string;
  evaluationNotes?: string;
  serviceType: ServiceType;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationCaseSchema: Schema = new Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    dataType: {
      type: String,
      enum: ['PUBLIC_WEB', 'REAL_PILOT', 'LIVE_API', 'SYNTHETIC'],
      default: 'PUBLIC_WEB',
      required: true,
      index: true,
    },
    sourceOrganization: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    sourceDate: { type: String },
    locationContext: { type: String, required: true },
    problem: { type: String, required: true },
    observedInput: { type: String, required: true },
    publishedSolution: { type: String, required: true },
    groundTruth: { type: String, required: true },
    evaluationNotes: { type: String },
    serviceType: { type: String, default: 'SOLAR', required: true },
  },
  { timestamps: true }
);

export const EvaluationCase = mongoose.model<IEvaluationCase>(
  'EvaluationCase',
  EvaluationCaseSchema
);
