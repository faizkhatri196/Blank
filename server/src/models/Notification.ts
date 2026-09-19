import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  metadata?: {
    serviceType?: string;
    customerArea?: string;
    problem?: string;
    assignedByName?: string;
    ticketNumber?: string;
    [key: string]: any;
  };
  relatedTicketId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    relatedTicketId: { type: Schema.Types.ObjectId, ref: 'ServiceTicket', index: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ companyId: 1, recipientUserId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
