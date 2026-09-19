import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification';

export interface CreateNotificationParams {
  recipientUserId: string | mongoose.Types.ObjectId;
  companyId: string | mongoose.Types.ObjectId;
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
  relatedTicketId?: string | mongoose.Types.ObjectId;
}

export class NotificationService {
  public static async sendNotification(params: CreateNotificationParams): Promise<INotification> {
    return Notification.create({
      recipientUserId: new mongoose.Types.ObjectId(params.recipientUserId.toString()),
      companyId: new mongoose.Types.ObjectId(params.companyId.toString()),
      type: params.type,
      title: params.title.trim(),
      message: params.message.trim(),
      metadata: params.metadata || {},
      relatedTicketId: params.relatedTicketId ? new mongoose.Types.ObjectId(params.relatedTicketId.toString()) : undefined,
      read: false,
    });
  }

  public static async getUserNotifications(
    userId: string | mongoose.Types.ObjectId,
    companyId: string | mongoose.Types.ObjectId,
    limit: number = 30
  ): Promise<INotification[]> {
    return Notification.find({
      recipientUserId: new mongoose.Types.ObjectId(userId.toString()),
      companyId: new mongoose.Types.ObjectId(companyId.toString()),
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  public static async markAsRead(
    notificationId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
    companyId: string | mongoose.Types.ObjectId
  ): Promise<boolean> {
    const result = await Notification.updateOne(
      {
        _id: new mongoose.Types.ObjectId(notificationId.toString()),
        recipientUserId: new mongoose.Types.ObjectId(userId.toString()),
        companyId: new mongoose.Types.ObjectId(companyId.toString()),
      },
      { $set: { read: true } }
    );
    return result.modifiedCount > 0;
  }

  public static async markAllAsRead(
    userId: string | mongoose.Types.ObjectId,
    companyId: string | mongoose.Types.ObjectId
  ): Promise<number> {
    const result = await Notification.updateMany(
      {
        recipientUserId: new mongoose.Types.ObjectId(userId.toString()),
        companyId: new mongoose.Types.ObjectId(companyId.toString()),
        read: false,
      },
      { $set: { read: true } }
    );
    return result.modifiedCount;
  }
}
