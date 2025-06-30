import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { IStorage } from './storage';
import { 
  users, technicians, tasks, invoices, botSettings, notifications, systemSettings, adminProfiles,
  User, Technician, Task, Invoice, BotSettings, Notification, SystemSettings, AdminProfile,
  InsertUser, InsertTechnician, InsertTask, InsertInvoice, InsertBotSettings, InsertNotification, InsertSystemSettings, InsertAdminProfile
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
const db = drizzle(client);

// Helper function to convert null to undefined for optional fields and parse technicianIds
function normalizeNullFields<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] === null) {
      result[key] = undefined;
    }
  }
  return result;
}

// Helper function to safely parse technicianIds
function parseTechnicianIds(technicianIds: any): number[] {
  if (!technicianIds) return [];
  
  if (Array.isArray(technicianIds)) {
    return technicianIds.filter(id => typeof id === 'number');
  }
  
  if (typeof technicianIds === 'string') {
    try {
      // Try direct JSON parsing first
      return JSON.parse(technicianIds);
    } catch {
      // If JSON parsing fails, return empty array for now
      console.warn('Failed to parse technicianIds:', technicianIds);
      return [];
    }
  }
  
  return [];
}

export class PostgreSQLStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    const results = await db.select().from(technicians).orderBy(desc(technicians.joinedAt));
    return results.map(tech => normalizeNullFields(tech) as Technician);
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
    if (!result[0]) return undefined;
    return normalizeNullFields(result[0]) as Technician;
  }

  async getTechnicianByTelegramId(telegramId: string): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.telegramId, telegramId)).limit(1);
    if (!result[0]) return undefined;
    return normalizeNullFields(result[0]) as Technician;
  }

  async createTechnician(technician: InsertTechnician): Promise<Technician> {
    const result = await db.insert(technicians).values(technician).returning();
    return normalizeNullFields(result[0]) as Technician;
  }

  async updateTechnician(id: number, updates: Partial<Technician>): Promise<Technician | undefined> {
    const result = await db.update(technicians).set(updates).where(eq(technicians.id, id)).returning();
    if (!result[0]) return undefined;
    return normalizeNullFields(result[0]) as Technician;
  }

  async deleteTechnician(id: number): Promise<boolean> {
    try {
      // Use the postgres client directly with template syntax
      const result = await client`DELETE FROM technicians WHERE id = ${id}`;
      console.log('Delete result:', result);
      
      const rowsAffected = result.count || 0;
      console.log('Rows affected:', rowsAffected);
      return rowsAffected > 0;
    } catch (error) {
      console.error('Error deleting technician:', error);
      return false;
    }
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const results = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    return results.map(task => {
      const normalized = normalizeNullFields(task);
      normalized.technicianIds = parseTechnicianIds(normalized.technicianIds);
      return normalized as Task;
    });
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!result[0]) return undefined;
    const normalized = normalizeNullFields(result[0]);
    normalized.technicianIds = parseTechnicianIds(normalized.technicianIds);
    return normalized as Task;
  }

  async getTasksByTechnician(technicianId: number): Promise<Task[]> {
    console.log('PostgreSQL getTasksByTechnician called with:', technicianId, 'Type:', typeof technicianId);
    
    // Get all tasks and filter client-side to avoid array query issues
    const allTasks = await db.select().from(tasks);
    console.log('Retrieved all tasks, count:', allTasks.length);
    
    const filteredTasks = allTasks.filter(task => {
      let taskTechIds = task.technicianIds;
      
      // Handle string representation of array
      if (typeof taskTechIds === 'string') {
        try {
          taskTechIds = JSON.parse(taskTechIds);
        } catch {
          console.log('Failed to parse technician_ids for task:', task.id);
          return false;
        }
      }
      
      // Check if technicianId is in the array
      const isAssigned = Array.isArray(taskTechIds) && taskTechIds.includes(technicianId);
      if (isAssigned) {
        console.log('Task', task.id, 'is assigned to technician', technicianId);
      }
      return isAssigned;
    });
    
    console.log('Found', filteredTasks.length, 'tasks for technician', technicianId);
    
    return filteredTasks.map(task => {
      const normalized = normalizeNullFields(task);
      if (typeof normalized.technicianIds === 'string') {
        try {
          normalized.technicianIds = JSON.parse(normalized.technicianIds);
        } catch {
          normalized.technicianIds = [];
        }
      }
      return normalized as Task;
    });
  }

  async getTasksByTechnicians(technicianIds: number[]): Promise<Task[]> {
    const results = await db.select().from(tasks);
    const filteredTasks = results.filter(task => {
      let taskTechIds = task.technicianIds;
      if (typeof taskTechIds === 'string') {
        try {
          taskTechIds = JSON.parse(taskTechIds);
        } catch {
          taskTechIds = [];
        }
      }
      if (Array.isArray(taskTechIds)) {
        return taskTechIds.some(id => technicianIds.includes(id));
      }
      return false;
    });
    
    return filteredTasks.map(task => {
      const normalized = normalizeNullFields(task);
      if (typeof normalized.technicianIds === 'string') {
        try {
          normalized.technicianIds = JSON.parse(normalized.technicianIds);
        } catch {
          normalized.technicianIds = [];
        }
      }
      return normalized as Task;
    });
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    const results = await db.select().from(tasks).where(eq(tasks.status, status));
    return results.map(task => {
      const normalized = normalizeNullFields(task);
      if (typeof normalized.technicianIds === 'string') {
        try {
          normalized.technicianIds = JSON.parse(normalized.technicianIds);
        } catch {
          normalized.technicianIds = [];
        }
      }
      return normalized as Task;
    });
  }

  async createTask(task: InsertTask): Promise<Task> {
    const taskToInsert = {
      ...task,
      technicianIds: Array.isArray(task.technicianIds) ? JSON.stringify(task.technicianIds) : task.technicianIds
    };
    const result = await db.insert(tasks).values(taskToInsert).returning();
    const normalized = normalizeNullFields(result[0]);
    if (typeof normalized.technicianIds === 'string') {
      try {
        normalized.technicianIds = JSON.parse(normalized.technicianIds);
      } catch {
        normalized.technicianIds = [];
      }
    }
    return normalized as Task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const updateData = { ...updates };
    if (updateData.technicianIds && Array.isArray(updateData.technicianIds)) {
      updateData.technicianIds = JSON.stringify(updateData.technicianIds) as any;
    }
    
    const result = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    if (!result[0]) return undefined;
    
    const normalized = normalizeNullFields(result[0]);
    if (typeof normalized.technicianIds === 'string') {
      try {
        normalized.technicianIds = JSON.parse(normalized.technicianIds);
      } catch {
        normalized.technicianIds = [];
      }
    }
    return normalized as Task;
  }

  async deleteTask(id: number): Promise<boolean> {
    try {
      console.log(`PostgreSQL: Attempting to delete task with ID ${id}`);
      const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
      console.log(`PostgreSQL: Delete result:`, result);
      const success = result.length > 0;
      console.log(`PostgreSQL: Delete success: ${success}`);
      return success;
    } catch (error) {
      console.error('PostgreSQL: Error deleting task:', error);
      return false;
    }
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const results = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    return results.map(invoice => normalizeNullFields(invoice) as Invoice);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    console.log('PostgreSQL getInvoice called with:', id, 'Type:', typeof id);
    
    // Ensure id is a number
    const numericId = Number(id);
    if (isNaN(numericId)) {
      console.error('Invalid invoice ID for database query:', id);
      return undefined;
    }
    
    const result = await db.select().from(invoices).where(eq(invoices.id, numericId)).limit(1);
    console.log('Database query result:', result.length > 0 ? 'Found invoice' : 'No invoice found');
    
    if (!result[0]) return undefined;
    return normalizeNullFields(result[0]) as Invoice;
  }

  async getInvoicesByTechnician(technicianId: number): Promise<Invoice[]> {
    const results = await db.select().from(invoices).where(eq(invoices.technicianId, technicianId.toString()));
    return results.map(invoice => normalizeNullFields(invoice) as Invoice);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return normalizeNullFields(result[0]) as Invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices).set(updates).where(eq(invoices.id, id)).returning();
    if (!result[0]) return undefined;
    return normalizeNullFields(result[0]) as Invoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`DELETE FROM invoices WHERE id = ${id} RETURNING id`);
      console.log('Delete result:', result);
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings | undefined> {
    try {
      const result = await db.select().from(botSettings).limit(1);
      if (!result[0]) return undefined;
      return normalizeNullFields(result[0]) as BotSettings;
    } catch (error) {
      console.log('No bot settings found - starting fresh');
      return undefined;
    }
  }

  async updateBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    // Try to update first
    const existingSettings = await this.getBotSettings();
    
    if (existingSettings) {
      const result = await db.update(botSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(botSettings.id, existingSettings.id))
        .returning();
      return normalizeNullFields(result[0]) as BotSettings;
    } else {
      // Insert new settings
      const result = await db.insert(botSettings).values({
        ...settings,
        updatedAt: new Date()
      }).returning();
      return normalizeNullFields(result[0]) as BotSettings;
    }
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const results = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
    return results.map(notification => normalizeNullFields(notification) as Notification);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return normalizeNullFields(result[0]) as Notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return (result as any).rowCount > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result as any).rowCount > 0;
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    const results = await db.select().from(notifications).where(eq(notifications.isRead, false));
    return results.map(notification => normalizeNullFields(notification) as Notification);
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const result = await db.select().from(systemSettings).limit(1);
    if (!result[0]) return undefined;
    return normalizeNullFields(result[0]) as SystemSettings;
  }

  async updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings> {
    // Try to update first
    const existingSettings = await this.getSystemSettings();
    
    if (existingSettings) {
      const result = await db.update(systemSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(systemSettings.id, existingSettings.id))
        .returning();
      return normalizeNullFields(result[0]) as SystemSettings;
    } else {
      // Insert new settings
      const result = await db.insert(systemSettings).values({
        ...settings,
        updatedAt: new Date(),
        createdAt: new Date()
      }).returning();
      return normalizeNullFields(result[0]) as SystemSettings;
    }
  }

  // Admin Profile methods
  async getAdminProfile(): Promise<AdminProfile | undefined> {
    try {
      const [profile] = await db.select().from(adminProfiles).limit(1);
      return profile ? normalizeNullFields(profile) : undefined;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      return undefined;
    }
  }

  async upsertAdminProfile(profileData: Partial<InsertAdminProfile>): Promise<AdminProfile> {
    try {
      const [profile] = await db
        .insert(adminProfiles)
        .values({
          username: profileData.username || 'admin',
          displayName: profileData.displayName || 'Administrator', 
          email: profileData.email || 'admin@techmanager.com',
          phone: profileData.phone || '',
          phoneLoginEnabled: profileData.phoneLoginEnabled || false,
          passwordHash: profileData.passwordHash,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: adminProfiles.username,
          set: {
            displayName: profileData.displayName,
            email: profileData.email,
            phone: profileData.phone,
            phoneLoginEnabled: profileData.phoneLoginEnabled,
            passwordHash: profileData.passwordHash,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();

      return normalizeNullFields(profile);
    } catch (error) {
      console.error('Error upserting admin profile:', error);
      throw error;
    }
  }
}