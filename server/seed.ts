import { db } from './db';
import { users, technicians, tasks, systemSettings, botSettings, notifications } from '../shared/schema';

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create default admin user
    try {
      await db.insert(users).values({
        username: 'admin',
        password: 'admin123', // Change this in production
        role: 'admin'
      });
    } catch (error) {
      console.log('Admin user already exists or error:', error);
    }

    // Create system settings
    try {
      await db.insert(systemSettings).values({
        language: 'en',
        rtlEnabled: false,
        dateFormat: 'dd/mm/yyyy',
        timeFormat: '24h',
        currency: 'EUR',
        defaultView: 'table',
        isLocked: false
      });
    } catch (error) {
      console.log('System settings already exist or error:', error);
    }

    // Create default bot settings
    try {
      await db.insert(botSettings).values({
        botToken: '',
        isActive: false,
        googleMapsApiKey: ''
      });
    } catch (error) {
      console.log('Bot settings already exist or error:', error);
    }

    // Create sample technicians
    const sampleTechnicians = [
      {
        name: 'أحمد محمد',
        phone: '+49123456789',
        email: 'ahmed@example.com',
        specialization: 'كهرباء',
        isActive: true,
        telegramId: '',
        location: 'برلين'
      },
      {
        name: 'فاطمة علي',
        phone: '+49987654321',
        email: 'fatima@example.com',
        specialization: 'سباكة',
        isActive: true,
        telegramId: '',
        location: 'ميونخ'
      },
      {
        name: 'عمر حسن',
        phone: '+49555666777',
        email: 'omar@example.com',
        specialization: 'تكييف',
        isActive: true,
        telegramId: '',
        location: 'هامبورغ'
      }
    ];

    for (const tech of sampleTechnicians) {
      await db.insert(technicians).values(tech).onConflictDoNothing();
    }

    // Create sample tasks
    const sampleTasks = [
      {
        taskId: 'TASK-001',
        taskNumber: 'T-2024-001',
        title: 'إصلاح كهرباء المطبخ',
        description: 'مشكلة في الإضاءة والمفاتيح الكهربائية',
        clientName: 'محمد أحمد',
        clientPhone: '+49111222333',
        clientAddress: 'Hauptstraße 123, 10115 Berlin',
        technicianId: 1,
        technicianIds: [1],
        priority: 'high',
        status: 'assigned',
        scheduledDate: new Date('2024-06-20'),
        estimatedDuration: 2,
        serviceType: 'electrical',
        paymentStatus: 'pending'
      },
      {
        taskId: 'TASK-002',
        taskNumber: 'T-2024-002',
        title: 'تنظيف نظام التكييف',
        description: 'صيانة دورية وتنظيف المرشحات',
        clientName: 'سارة محمود',
        clientPhone: '+49444555666',
        clientAddress: 'Marienplatz 1, 80331 München',
        technicianId: 3,
        technicianIds: [3],
        priority: 'medium',
        status: 'in_progress',
        scheduledDate: new Date('2024-06-21'),
        estimatedDuration: 1.5,
        serviceType: 'hvac',
        paymentStatus: 'paid'
      }
    ];

    for (const task of sampleTasks) {
      await db.insert(tasks).values(task).onConflictDoNothing();
    }

    // Create sample notifications
    const sampleNotifications = [
      {
        message: 'تم تعيين مهمة جديدة: إصلاح كهرباء المطبخ',
        type: 'task_assigned',
        isRead: false,
        userId: 1
      },
      {
        message: 'تم إكمال المهمة: تنظيف نظام التكييف',
        type: 'task_completed',
        isRead: false,
        userId: 1
      }
    ];

    for (const notification of sampleNotifications) {
      await db.insert(notifications).values(notification).onConflictDoNothing();
    }

    console.log('✅ Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}