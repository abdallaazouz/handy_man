import { z } from "zod";
import { pgTable, serial, text, boolean, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// TypeScript interfaces for in-memory storage
// Database Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  createdAt: Date;
}

export const technicians = pgTable('technicians', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }),
  username: varchar('username', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 255 }),
  serviceProvided: text('service_provided'),
  cityArea: varchar('city_area', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export interface Technician {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  serviceProvided?: string;
  cityArea?: string;
  isActive: boolean;
  joinedAt: Date;
}

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 255 }).notNull().unique(),
  taskNumber: varchar('task_number', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientPhone: varchar('client_phone', { length: 255 }).notNull(),
  location: text('location').notNull(),
  mapUrl: text('map_url'),
  technicianIds: text('technician_ids'), // JSON array as text
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('unpaid'),
  scheduledDate: varchar('scheduled_date', { length: 255 }).notNull(),
  scheduledTimeFrom: varchar('scheduled_time_from', { length: 255 }).notNull(),
  scheduledTimeTo: varchar('scheduled_time_to', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export interface Task {
  id: number;
  taskId: string;
  taskNumber: string;
  title: string;
  description: string;
  clientName: string;
  clientPhone: string;
  location: string;
  mapUrl?: string;
  technicianIds?: number[];
  status: string;
  paymentStatus: string;
  scheduledDate: string;
  scheduledTimeFrom: string;
  scheduledTimeTo: string;
  createdAt: Date;
  updatedAt: Date;
}

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 255 }).notNull().unique(),
  taskId: varchar('task_id', { length: 255 }).notNull(),
  technicianId: varchar('technician_id', { length: 255 }).notNull(),
  amount: integer('amount').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentMethod: text('payment_method').array().notNull(),
  issueDate: varchar('issue_date', { length: 255 }).notNull(),
  dueDate: varchar('due_date', { length: 255 }).notNull(),
  paidDate: varchar('paid_date', { length: 255 }),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export interface Invoice {
  id: number;
  invoiceNumber: string;
  taskId: string;
  technicianId: string;
  amount: number;
  status: string;
  paymentMethod: string[];
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  clientName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const botSettings = pgTable('bot_settings', {
  id: serial('id').primaryKey(),
  botToken: text('bot_token').notNull(),
  googleMapsApiKey: text('google_maps_api_key'),
  enableNotifications: boolean('enable_notifications').notNull().default(true),
  isEnabled: boolean('is_enabled').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export interface BotSettings {
  id: number;
  botToken: string;
  googleMapsApiKey?: string;
  enableNotifications: boolean;
  isEnabled: boolean;
  updatedAt: Date;
}

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 100 }).notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface Notification {
  id: number;
  type: string;
  message: string;
  metadata?: string;
  isRead: boolean;
  createdAt: Date;
}

export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  rtlEnabled: boolean('rtl_enabled').notNull().default(false),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  dateFormat: varchar('date_format', { length: 50 }).notNull().default('YYYY-MM-DD'),
  theme: varchar('theme', { length: 20 }).notNull().default('light'),
  enableDashboard: boolean('enable_dashboard').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface SystemSettings {
  id: number;
  language: string;
  rtlEnabled: boolean;
  timezone: string;
  dateFormat: string;
  theme: string;
  enableDashboard: boolean;
  updatedAt: Date;
  createdAt: Date;
}

// Admin profile table for persistent storage
export const adminProfiles = pgTable("admin_profiles", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  phoneLoginEnabled: boolean("phone_login_enabled").default(false),
  passwordHash: varchar("password_hash", { length: 255 }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface AdminProfile {
  id: number;
  username: string;
  displayName?: string;
  email: string;
  phone?: string;
  phoneLoginEnabled: boolean;
  passwordHash?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.string().default("admin"),
});

export const insertTechnicianSchema = z.object({
  telegramId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  username: z.string().optional(),
  phoneNumber: z.string().optional(),
  serviceProvided: z.string().optional(),
  cityArea: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertTaskSchema = z.object({
  taskId: z.string().min(1),
  taskNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  location: z.string().min(1),
  mapUrl: z.string().optional(),
  technicianIds: z.array(z.number()).optional(),
  status: z.string().default("pending"),
  paymentStatus: z.string().default("on_demand"),
  scheduledDate: z.string().min(1),
  scheduledTimeFrom: z.string().min(1),
  scheduledTimeTo: z.string().min(1),
});

export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  taskId: z.string().min(1),
  technicianId: z.string().min(1),
  amount: z.number().positive(),
  status: z.string().default("pending"),
  paymentMethod: z.array(z.string()).default([]),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  paidDate: z.string().optional(),
  clientName: z.string().min(1),
});

export const insertBotSettingsSchema = z.object({
  botToken: z.string().optional(),
  googleMapsApiKey: z.string().optional(),
  enableNotifications: z.boolean().default(true),
  isEnabled: z.boolean().default(false),
});

export const insertNotificationSchema = z.object({
  type: z.string().min(1),
  message: z.string().min(1),
  metadata: z.string().optional(),
  isRead: z.boolean().default(false),
});

export const insertSystemSettingsSchema = z.object({
  language: z.string().default("en"),
  rtlEnabled: z.boolean().default(false),
  timezone: z.string().default("UTC"),
  dateFormat: z.string().default("YYYY-MM-DD"),
  theme: z.string().default("light"),
  enableDashboard: z.boolean().default(true),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

// Admin Profile schema
const insertAdminProfileSchema = createInsertSchema(adminProfiles);
export type InsertAdminProfile = z.infer<typeof insertAdminProfileSchema>;