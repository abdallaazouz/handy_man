import { IStorage } from './storage';
import { InsertNotification } from '../shared/schema';

export class NotificationService {
  private storage: IStorage;
  private notificationCallbacks: Array<(notification: any) => void> = [];

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Subscribe to real-time notifications
  subscribe(callback: (notification: any) => void) {
    this.notificationCallbacks.push(callback);
  }

  // Unsubscribe from notifications
  unsubscribe(callback: (notification: any) => void) {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }

  // Create notification and broadcast immediately
  async createNotification(notification: InsertNotification): Promise<void> {
    try {
      // Ensure createdAt is set to current timestamp
      const notificationWithTimestamp = {
        ...notification,
        createdAt: new Date()
      };
      
      const createdNotification = await this.storage.createNotification(notificationWithTimestamp);
      
      // Broadcast to all subscribers immediately with zero delay
      setImmediate(() => {
        this.notificationCallbacks.forEach(callback => {
          try {
            callback(createdNotification);
          } catch (error) {
            console.error('Error in notification callback:', error);
          }
        });
      });

      console.log(`📢 Notification created: ${notification.type} - ${notification.message}`);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Create activity log entry
  async logActivity(type: string, message: string, metadata?: any): Promise<void> {
    try {
      const logEntry = {
        type: `activity_${type}`,
        message,
        isRead: false,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      };

      await this.createNotification(logEntry as InsertNotification);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}

// Global notification service instance
let notificationService: NotificationService | null = null;

export function getNotificationService(storage: IStorage): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(storage);
  }
  return notificationService;
}