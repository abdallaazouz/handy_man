import { 
  type User, type InsertUser,
  type Technician, type InsertTechnician,
  type Task, type InsertTask,
  type Invoice, type InsertInvoice,
  type BotSettings, type InsertBotSettings,
  type Notification, type InsertNotification,
  type SystemSettings, type InsertSystemSettings
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Technicians
  getTechnicians(): Promise<Technician[]>;
  getTechnician(id: number): Promise<Technician | undefined>;
  getTechnicianByTelegramId(telegramId: string): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: number, technician: Partial<Technician>): Promise<Technician | undefined>;
  deleteTechnician(id: number): Promise<boolean>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByTechnician(technicianId: number): Promise<Task[]>;
  getTasksByTechnicians(technicianIds: number[]): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByTechnician(technicianId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Bot Settings
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: InsertBotSettings): Promise<BotSettings>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  getUnreadNotifications(): Promise<Notification[]>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings>;

  // Admin Profile
  getAdminProfile?(): Promise<any | undefined>;
  upsertAdminProfile?(profileData: any): Promise<any>;
}

// In-Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private technicians: Map<number, Technician>;
  private tasks: Map<number, Task>;
  private invoices: Map<number, Invoice>;
  private botSettings: BotSettings | undefined;
  private notifications: Map<number, Notification>;
  private systemSettings: SystemSettings | undefined;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.technicians = new Map();
    this.tasks = new Map();
    this.invoices = new Map();
    this.notifications = new Map();
    this.currentId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private async initializeData() {
    // Create default admin user
    await this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin"
    });

    // Create sample technicians
    const sampleTechnicians = [
      {
        telegramId: "123456789",
        firstName: "أحمد",
        lastName: "محمد",
        username: "ahmed_tech",
        phoneNumber: "+966501234567",
        serviceProvided: "صيانة كهربائية",
        cityArea: "الرياض - الملز"
      },
      {
        telegramId: "987654321",
        firstName: "فاطمة",
        lastName: "عبدالله",
        username: "fatima_tech",
        phoneNumber: "+966509876543",
        serviceProvided: "صيانة سباكة",
        cityArea: "جدة - الحمراء"
      },
      {
        telegramId: "456789123",
        firstName: "محمد",
        lastName: "علي",
        username: "mohamed_tech",
        phoneNumber: "+966505555555",
        serviceProvided: "صيانة تكييف",
        cityArea: "الدمام - الشاطئ"
      },
      {
        telegramId: "789123456",
        firstName: "نورا",
        lastName: "سعد",
        username: "nora_tech",
        phoneNumber: "+966507777777",
        serviceProvided: "صيانة إلكترونيات",
        cityArea: "الرياض - النرجس"
      },
      {
        telegramId: "321654987",
        firstName: "خالد",
        lastName: "إبراهيم",
        username: "khalid_tech",
        phoneNumber: "+966503333333",
        serviceProvided: "صيانة شبكات",
        cityArea: "مكة - العزيزية"
      },
      {
        telegramId: "654987321",
        firstName: "مريم",
        lastName: "الأحمد",
        username: "mariam_tech",
        phoneNumber: "+966508888888",
        serviceProvided: "صيانة عامة",
        cityArea: "الطائف - الحوية"
      }
    ];

    for (const tech of sampleTechnicians) {
      await this.createTechnician(tech);
    }

    // Create sample task
    await this.createTask({
      taskId: "TASK-001",
      taskNumber: "T-2024-001",
      title: "إصلاح تكييف مركزي",
      description: "تحتاج وحدة التكييف المركزي إلى صيانة شاملة وإصلاح مشكلة عدم التبريد",
      clientName: "شركة الأعمال المتقدمة",
      clientPhone: "+966501234567",
      location: "الرياض، حي الملز، شارع الأمير محمد بن عبدالعزيز",
      mapUrl: "https://maps.google.com/?q=24.6408,46.7728",
      technicianIds: [3],
      status: "pending",
      paymentStatus: "on_demand",
      scheduledDate: "2024-12-25",
      scheduledTimeFrom: "09:00",
      scheduledTimeTo: "12:00"
    });

    // Create bot settings
    this.botSettings = {
      id: 1,
      botToken: " ",
      googleMapsApiKey: " ",
      enableNotifications: true,
      isEnabled: false,
      updatedAt: new Date()
    };

    // Create system settings
    this.systemSettings = {
      id: 1,
      language: "en",
      rtlEnabled: false,
      timezone: "Asia/Riyadh",
      dateFormat: "DD/MM/YYYY",
      theme: "light",
      enableDashboard: true,
      updatedAt: new Date(),
      createdAt: new Date()
    };

    // Create sample notification
    await this.createNotification({
      type: "task_assigned",
      message: "تم تعيين مهمة جديدة: إصلاح تكييف مركزي",
      isRead: false
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values());
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async getTechnicianByTelegramId(telegramId: string): Promise<Technician | undefined> {
    for (const technician of this.technicians.values()) {
      if (technician.telegramId === telegramId) {
        return technician;
      }
    }
    return undefined;
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const id = this.currentId++;
    const technician: Technician = { 
      ...insertTechnician, 
      id, 
      isActive: insertTechnician.isActive ?? true,
      joinedAt: new Date() 
    };
    this.technicians.set(id, technician);
    return technician;
  }

  async updateTechnician(id: number, update: Partial<Technician>): Promise<Technician | undefined> {
    const technician = this.technicians.get(id);
    if (!technician) return undefined;
    
    const updated = { ...technician, ...update };
    this.technicians.set(id, updated);
    return updated;
  }

  async deleteTechnician(id: number): Promise<boolean> {
    return this.technicians.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByTechnician(technicianId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.technicianIds?.includes(technicianId)
    );
  }

  async getTasksByTechnicians(technicianIds: number[]): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.technicianIds?.some(id => technicianIds.includes(id))
    );
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, update: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updated = { ...task, ...update, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByTechnician(technicianId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => 
      invoice.technicianId === String(technicianId)
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentId++;
    const invoice: Invoice = { 
      ...insertInvoice, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, update: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updated = { ...invoice, ...update, updatedAt: new Date() };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettings;
  }

  async updateBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const botSettings: BotSettings = {
      id: 1,
      botToken: settings.botToken || "",
      googleMapsApiKey: settings.googleMapsApiKey || "",
      enableNotifications: settings.enableNotifications ?? true,
      isEnabled: settings.isEnabled ?? false,
      updatedAt: new Date()
    };
    this.botSettings = botSettings;
    return botSettings;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      isRead: false,
      createdAt: new Date() 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    this.notifications.set(id, { ...notification, isRead: true });
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => !notification.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSystemSettings(): Promise<SystemSettings | undefined> {
    return this.systemSettings;
  }

  async updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings> {
    const systemSettings: SystemSettings = {
      id: 1,
      language: settings.language || 'en',
      rtlEnabled: settings.rtlEnabled || false,
      timezone: settings.timezone || 'UTC',
      dateFormat: settings.dateFormat || 'YYYY-MM-DD',
      theme: settings.theme || 'light',
      enableDashboard: settings.enableDashboard ?? true,
      updatedAt: new Date(),
      createdAt: this.systemSettings?.createdAt || new Date(),
    };
    
    this.systemSettings = systemSettings;
    return systemSettings;
  }
}

// Initialize in-memory storage
const storageInstance: IStorage = new MemStorage();
console.log('✅ Using in-memory storage');

export const storage = storageInstance;