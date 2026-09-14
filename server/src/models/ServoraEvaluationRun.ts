import mongoose, { Schema, Document } from 'mongoose';

export interface IServoraEvaluationRun extends Document {
  caseId: string;
  evaluationCaseId: mongoose.Types.ObjectId;
  version: 'v1' | 'v2';
  provider: string;
  aiModel: string;
  timestamp: Date;
  servoraInput: string;
  servoraOutput: {
    possibleCauses: string[];
    diagnosticSteps: string[];
    requiredEvidence: string[];
    requiredTools: string[];
    potentialParts: string[];
    safetyInstructions: string[];
    recommendedTechnician?: {
      id: string;
      name: string;
      score: number;
      reasons: string[];
    };
    priority: string;
    confidence: string;
    humanReviewRequired: boolean;
    finalRecommendation: string;
  };
  diagnosisScore: number;
  evidenceScore: number;
  safetyScore: number;
  operationalScore: number;
  technicianScore: number;
  traceabilityScore: number;
  totalScore: number;
  matchedItems: string[];
  missedItems: string[];
  unsupportedClaims: string[];
  safetyIssues: string[];
  safetyPass: boolean;
  repeatVisitOpportunity: boolean;
  repeatVisitReason: string;
  productImprovement: string;
  humanReviewRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServoraEvaluationRunSchema: Schema = new Schema(
  {
    caseId: { type: String, required: true, index: true },
    evaluationCaseId: {
      type: Schema.Types.ObjectId,
      ref: 'EvaluationCase',
      required: true,
      index: true,
    },
    version: { type: String, enum: ['v1', 'v2'], default: 'v1', required: true, index: true },
    provider: { type: String, required: true },
    aiModel: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    servoraInput: { type: String, required: true },
    servoraOutput: {
      possibleCauses: [{ type: String }],
      diagnosticSteps: [{ type: String }],
      requiredEvidence: [{ type: String }],
      requiredTools: [{ type: String }],
      potentialParts: [{ type: String }],
      safetyInstructions: [{ type: String }],
      recommendedTechnician: {
        id: { type: String },
        name: { type: String },
        score: { type: Number },
        reasons: [{ type: String }],
      },
      priority: { type: String, default: 'MEDIUM' },
      confidence: { type: String, default: 'MEDIUM' },
      humanReviewRequired: { type: Boolean, default: true },
      finalRecommendation: { type: String, default: '' },
    },
    diagnosisScore: { type: Number, required: true, min: 0, max: 30 },
    evidenceScore: { type: Number, required: true, min: 0, max: 20 },
    safetyScore: { type: Number, required: true, min: 0, max: 20 },
    operationalScore: { type: Number, required: true, min: 0, max: 15 },
    technicianScore: { type: Number, required: true, min: 0, max: 10 },
    traceabilityScore: { type: Number, required: true, min: 0, max: 5 },
    totalScore: { type: Number, required: true, min: 0, max: 100 },
    matchedItems: [{ type: String }],
    missedItems: [{ type: String }],
    unsupportedClaims: [{ type: String }],
    safetyIssues: [{ type: String }],
    safetyPass: { type: Boolean, default: true },
    repeatVisitOpportunity: { type: Boolean, default: true },
    repeatVisitReason: { type: String, default: '' },
    productImprovement: { type: String, default: '' },
    humanReviewRequired: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServoraEvaluationRun = mongoose.model<IServoraEvaluationRun>(
  'ServoraEvaluationRun',
  ServoraEvaluationRunSchema
);
