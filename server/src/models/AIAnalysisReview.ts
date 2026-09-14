import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAnalysisReview extends Document {
  ticketId: mongoose.Types.ObjectId;
  originalAIAnalysisId: mongoose.Types.ObjectId;
  reviewedBy: mongoose.Types.ObjectId;
  accepted: boolean;
  editedChecklist?: string[];
  editedTools?: string[];
  editedParts?: string[];
  managerNotes?: string;
  reviewedAt: Date;
}

const AIAnalysisReviewSchema = new Schema<IAIAnalysisReview>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket', required: true, index: true },
    originalAIAnalysisId: { type: Schema.Types.ObjectId, ref: 'AIAnalysis', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accepted: { type: Boolean, default: true },
    editedChecklist: { type: [String] },
    editedTools: { type: [String] },
    editedParts: { type: [String] },
    managerNotes: { type: String, default: '' },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AIAnalysisReview = mongoose.model<IAIAnalysisReview>('AIAnalysisReview', AIAnalysisReviewSchema);
