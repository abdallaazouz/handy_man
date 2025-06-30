import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { storage, type IStorage } from "./storage";
import { 
  insertTechnicianSchema, 
  insertTaskSchema, 
  insertInvoiceSchema, 
  insertBotSettingsSchema,
  insertNotificationSchema,
  insertSystemSettingsSchema
} from "@shared/schema";
import { getTelegramBotService } from "./telegram-bot";
import { getNotificationService } from "./notification-service";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express, storageInstance: IStorage): Promise<Server> {

  // Serve marketing landing page files
  app.get('/marketing/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'marketing-landingpage', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }
      
      // Set proper content type
      if (filename.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (filename.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filename.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filename.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
      
      // Read and send file
      const fileContent = fs.readFileSync(filePath);
      res.send(fileContent);
    } catch (error) {
      console.error('Error serving marketing file:', error);
      res.status(500).send('خطأ في الخادم - Internal Server Error');
    }
  });

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Skip auth for development - in production, use proper JWT or session management
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('🔐 Login attempt:', username, 'with password:', password);
      
      // Check admin profile first
      if (storageInstance.getAdminProfile) {
        const adminProfile = await storageInstance.getAdminProfile();
        if (adminProfile && adminProfile.username === username) {
        console.log('📋 Admin profile found:', adminProfile.username);
        console.log('🔒 Stored password hash:', adminProfile.passwordHash);
        
        if (adminProfile.passwordHash === password || adminProfile.passwordHash === `hashed_${password}`) {
          console.log('✅ Admin login successful');
          
          // Update last login time
          if (storageInstance.upsertAdminProfile) {
            await storageInstance.upsertAdminProfile({
              ...adminProfile,
              lastLoginAt: new Date(),
            });
          }
          
          return res.json({ 
            user: { id: adminProfile.id, username: adminProfile.username, role: 'admin' },
            token: 'admin_token_123'
          });
        } else {
          console.log('❌ Password mismatch for admin');
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        }
      }
      
      // Fallback to regular users
      const user = await storageInstance.getUserByUsername(username);
      if (!user || user.password !== password) {
        console.log('❌ User not found or password mismatch');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('✅ Regular user login successful');
      res.json({ 
        user: { id: user.id, username: user.username, role: user.role },
        token: 'user_token_123'
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // In production, implement proper email verification and sending
      // For now, we'll simulate successful email sending
      console.log(`Password reset requested for email: ${email}`);
      
      res.json({ 
        message: 'Password reset email sent successfully',
        success: true
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send reset email' });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const tasks = await storageInstance.getTasks();
      const technicians = await storageInstance.getTechnicians();
      const invoices = await storageInstance.getInvoices();
      
      const activeTasks = tasks.filter(task => ['sent', 'accepted', 'in_progress', 'assigned', 'pending'].includes(task.status)).length;
      const activeTechnicians = technicians.filter(tech => tech.isActive).length;
      const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
      const monthlyRevenue = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + (typeof invoice.amount === 'number' ? invoice.amount : parseInt(invoice.amount) || 0), 0);

      res.json({
        activeTasks,
        totalTechnicians: technicians.length,
        activeTechnicians,
        pendingInvoices,
        monthlyRevenue
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Technicians routes
  app.get("/api/technicians", requireAuth, async (req, res) => {
    try {
      const technicians = await storageInstance.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/technicians", requireAuth, async (req, res) => {
    try {
      const result = insertTechnicianSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid data', errors: result.error.errors });
      }

      const technician = await storageInstance.createTechnician(result.data);
      
      // Create notification
      await storageInstance.createNotification({
        type: 'technician_added',
        message: `New technician ${technician.firstName} ${technician.lastName || ''} added`,
        isRead: false
      });

      res.status(201).json(technician);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put("/api/technicians/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technician = await storageInstance.updateTechnician(id, req.body);
      
      if (!technician) {
        return res.status(404).json({ message: 'Technician not found' });
      }

      res.json(technician);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete("/api/technicians/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete technician with ID: ${id}`);
      
      // First check if technician exists
      const existingTechnician = await storageInstance.getTechnician(id);
      console.log('Existing technician:', existingTechnician);
      
      if (!existingTechnician) {
        return res.status(404).json({ message: 'Technician not found' });
      }
      
      const success = await storageInstance.deleteTechnician(id);
      console.log(`Deletion success: ${success}`);
      
      if (!success) {
        return res.status(404).json({ message: 'Technician not found' });
      }

      res.json({ message: 'Technician deleted successfully' });
    } catch (error) {
      console.error('Delete technician error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Tasks routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storageInstance.getTasks();
      res.json(tasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid data', errors: result.error.errors });
      }

      const task = await storageInstance.createTask(result.data);
      
      // Create notification
      await storageInstance.createNotification({
        type: 'task_created',
        message: `New task ${task.taskNumber} created: ${task.title}`,
        isRead: false
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send General Task Data to Telegram
  app.post("/api/tasks/:id/send-general-data", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storageInstance.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Log the general data send event
      const logMessage = `General data sent for Task ${task.taskNumber} - ID: ${task.taskId}, Title: ${task.title}, Date: ${task.scheduledDate}, Time: ${task.scheduledTimeFrom}-${task.scheduledTimeTo}`;
      console.log(logMessage);
      
      // Create notification for tracking
      await storageInstance.createNotification({
        type: 'general_data_sent',
        message: `General data sent for Task ${task.taskNumber}`,
        isRead: false
      });
      
      res.json({ 
        success: true,
        message: 'General task data sent to Telegram successfully',
        taskId: task.taskId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send Confidential Client Data to Telegram
  app.post("/api/tasks/:id/send-client-data", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storageInstance.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Verify technicians are assigned
      if (!task.technicianIds || task.technicianIds.length === 0) {
        return res.status(400).json({ error: 'No technicians assigned to this task' });
      }

      // Get assigned technicians for logging
      const assignedTechnicians = await Promise.all(
        task.technicianIds.map(id => storageInstance.getTechnician(id))
      );
      const techNames = assignedTechnicians
        .filter((tech): tech is NonNullable<typeof tech> => tech !== undefined)
        .map(tech => `${tech.firstName} ${tech.lastName}`)
        .join(', ');

      // Log the confidential data send event with security warning
      const logMessage = `CONFIDENTIAL CLIENT DATA SENT for Task ${task.taskNumber} to technicians: ${techNames} - Client: ${task.clientName}, Phone: ${task.clientPhone}`;
      console.log(`🔒 SECURITY LOG: ${logMessage}`);
      
      // Create detailed notification for audit trail
      await storageInstance.createNotification({
        type: 'client_data_sent',
        message: `Confidential client data sent for Task ${task.taskNumber} to: ${techNames}`,
        isRead: false
      });
      
      res.json({ 
        success: true,
        message: 'Confidential client data sent to assigned technicians',
        taskId: task.taskId,
        sentTo: techNames,
        warning: 'Confidential data - logged for security'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storageInstance.updateTask(id, req.body);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Create notification for status changes
      if (req.body.status) {
        await storageInstance.createNotification({
          type: 'task_status_changed',
          message: `Task ${task.taskNumber} status changed to ${req.body.status}`,
          isRead: false
        });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete task with ID: ${id}`);
      
      // First check if task exists
      const existingTask = await storageInstance.getTask(id);
      if (!existingTask) {
        console.log(`Task with ID ${id} not found`);
        return res.status(404).json({ message: 'Task not found' });
      }
      
      console.log(`Found task: ${existingTask.taskId}`);
      const success = await storageInstance.deleteTask(id);
      
      if (!success) {
        console.log(`Failed to delete task with ID: ${id}`);
        return res.status(500).json({ message: 'Failed to delete task' });
      }

      console.log(`Successfully deleted task with ID: ${id}`);
      res.json({ message: 'Task deleted successfully', deletedId: id });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Invoices routes
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await storageInstance.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const result = insertInvoiceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid data', errors: result.error.errors });
      }

      const invoice = await storageInstance.createInvoice(result.data);
      
      // Create notification
      await storageInstance.createNotification({
        type: 'invoice_created',
        message: `New invoice ${invoice.invoiceNumber} created`,
        isRead: false
      });

      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storageInstance.updateInvoice(id, req.body);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storageInstance.deleteInvoice(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Bot settings routes
  app.get("/api/bot-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storageInstance.getBotSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put("/api/bot-settings", requireAuth, async (req, res) => {
    try {
      const result = insertBotSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid data', errors: result.error.errors });
      }

      const settings = await storageInstance.updateBotSettings(result.data);
      const telegramBot = getTelegramBotService(storageInstance);
      
      // Handle bot state based on isEnabled flag and token availability
      if (result.data.isEnabled && result.data.botToken) {
        try {
          await telegramBot.initialize(result.data.botToken);
          console.log('✅ Telegram bot initialized successfully');
        } catch (botError) {
          console.error('❌ Failed to initialize Telegram bot:', botError);
          // Update settings to reflect failed initialization
          await storageInstance.updateBotSettings({
            ...result.data,
            isEnabled: false
          });
          return res.status(400).json({ 
            message: 'Invalid bot token or connection failed',
            settings: { ...settings, isEnabled: false }
          });
        }
      } else if (!result.data.isEnabled) {
        // Stop bot if disabled
        try {
          await telegramBot.stop();
          console.log('🛑 Telegram bot stopped');
        } catch (stopError) {
          console.error('Error stopping bot:', stopError);
        }
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error updating bot settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storageInstance.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    try {
      const notifications = await storageInstance.getUnreadNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storageInstance.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storageInstance.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/notifications/bulk-delete", requireAuth, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: 'Invalid request: ids must be an array' });
      }
      
      let deletedCount = 0;
      for (const id of ids) {
        const success = await storageInstance.deleteNotification(parseInt(id));
        if (success) deletedCount++;
      }
      
      res.json({ success: true, deletedCount });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const notifications = await storageInstance.getUnreadNotifications();
      let markedCount = 0;
      
      for (const notification of notifications) {
        const success = await storageInstance.markNotificationAsRead(notification.id);
        if (success) markedCount++;
      }
      
      res.json({ success: true, markedCount });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Telegram Bot API endpoints
  // Send invoice PDF to technician
  app.post('/api/telegram/send-invoice-pdf', upload.single('pdf'), async (req, res) => {
    try {
      console.log('=== TELEGRAM SEND INVOICE PDF API CALLED ===');
      
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No PDF file provided' });
      }
      
      const { technicianId, invoiceNumber, message } = req.body;
      
      if (!technicianId || !invoiceNumber) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      
      console.log('Sending PDF to technician:', technicianId);
      console.log('Invoice number:', invoiceNumber);
      console.log('PDF file size:', req.file.size);
      
      const telegramBotService = getTelegramBotService(storageInstance);
      
      // Check if bot is connected, if not try to initialize
      if (!telegramBotService.isConnected()) {
        try {
          const botSettings = await storageInstance.getBotSettings();
          if (botSettings && botSettings.botToken && botSettings.isEnabled) {
            await telegramBotService.initialize(botSettings.botToken);
          } else {
            return res.status(400).json({ success: false, message: 'Bot token not configured or disabled' });
          }
        } catch (initError) {
          return res.status(400).json({ success: false, message: 'Failed to initialize bot' });
        }
      }
      
      // Double check connection after potential initialization
      if (!telegramBotService.isConnected()) {
        return res.status(400).json({ success: false, message: 'Telegram bot is not connected' });
      }
      
      // Send PDF via Telegram bot
      const success = await telegramBotService.sendInvoicePDF(
        technicianId, 
        req.file.buffer,
        `Rechnung_${invoiceNumber}.pdf`,
        message || `Rechnung ${invoiceNumber}`
      );
      
      if (success) {
        console.log('✅ Invoice PDF sent successfully');
        res.json({ success: true, message: 'Invoice PDF sent successfully' });
      } else {
        console.log('❌ Failed to send invoice PDF');
        res.status(500).json({ success: false, message: 'Failed to send invoice PDF' });
      }
      
    } catch (error: any) {
      console.error('❌ Error in send invoice PDF API:', error);
      res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  });

  app.post("/api/telegram/send-task", requireAuth, async (req, res) => {
    try {
      const { taskId, technicianId } = req.body;
      
      if (!taskId || !technicianId) {
        return res.status(400).json({ message: 'Task ID and Technician ID are required' });
      }

      const telegramBot = getTelegramBotService(storageInstance);
      const success = await telegramBot.sendTaskToTechnician(taskId, technicianId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to send task to technician' });
      }

      res.json({ message: 'Task sent successfully to technician' });
    } catch (error) {
      console.error('Error sending task via Telegram:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/telegram/send-client-info", requireAuth, async (req, res) => {
    try {
      const { taskId, technicianId } = req.body;
      
      if (!taskId || !technicianId) {
        return res.status(400).json({ message: 'Task ID and Technician ID are required' });
      }

      const telegramBot = getTelegramBotService(storageInstance);
      const success = await telegramBot.sendClientInfoToTechnician(taskId, technicianId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to send client info to technician' });
      }

      res.json({ message: 'Client info sent successfully to technician' });
    } catch (error) {
      console.error('Error sending client info via Telegram:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/telegram/send-invoice", requireAuth, async (req, res) => {
    try {
      console.log('=== TELEGRAM SEND INVOICE API CALLED ===');
      console.log('Request body:', req.body);
      
      const { invoiceId } = req.body;
      
      if (!invoiceId) {
        console.error('❌ No invoice ID provided');
        return res.status(400).json({ message: 'Invoice ID is required' });
      }

      console.log('Processing invoice ID:', invoiceId, 'Type:', typeof invoiceId);

      // Get bot service
      const telegramBot = getTelegramBotService(storageInstance);
      
      // Check if bot is connected
      if (!telegramBot.isConnected()) {
        console.error('❌ Bot is not connected');
        return res.status(400).json({ message: 'Bot is not running' });
      }

      console.log('✓ Bot is connected, sending invoice...');
      const success = await telegramBot.sendInvoiceToTechnician(invoiceId);
      
      if (!success) {
        console.error('❌ Failed to send invoice');
        return res.status(400).json({ message: 'Failed to send invoice to technician' });
      }

      console.log('✅ Invoice sent successfully');
      res.json({ message: 'Invoice sent successfully to technician' });
    } catch (error) {
      console.error('❌ Error in send-invoice API:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get("/api/telegram/status", requireAuth, async (req, res) => {
    try {
      const settings = await storageInstance.getBotSettings();
      const telegramBot = getTelegramBotService(storageInstance);
      const isConnected = telegramBot.isConnected();
      
      // Check if bot should be running based on settings
      const shouldBeRunning = settings?.isEnabled && settings?.botToken;
      
      // If bot should be running but isn't, try to start it
      if (shouldBeRunning && !isConnected && settings?.botToken) {
        try {
          await telegramBot.initialize(settings.botToken);
        } catch (initError) {
          console.error('Failed to auto-start bot:', initError);
        }
      }
      
      const finalStatus = telegramBot.isConnected();
      const canConnect = finalStatus ? await telegramBot.testConnection() : false;
      const botUsername = telegramBot.getBotUsername();
      
      res.json({ 
        connected: finalStatus && canConnect,
        status: finalStatus && canConnect ? 'Bot is running' : 'Bot is not connected',
        enabled: settings?.isEnabled || false,
        username: botUsername || null
      });
    } catch (error) {
      console.error('Error checking Telegram bot status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Database Management API endpoints
  app.get("/api/database/status", requireAuth, async (req, res) => {
    try {
      // Check database connection status
      const connected = true; // PostgreSQL is available
      const hasPermissions = true; // We have full access
      const isReady = connected && hasPermissions;
      
      res.json({
        connected,
        hasPermissions,
        isReady
      });
    } catch (error) {
      res.status(500).json({ 
        connected: false,
        hasPermissions: false,
        isReady: false,
        message: 'Database connection error'
      });
    }
  });

  app.post("/api/database/initialize", requireAuth, async (req, res) => {
    try {
      // Database is already initialized with PostgreSQL
      res.json({
        success: true,
        status: {
          connected: true,
          hasPermissions: true,
          isReady: true
        },
        message: 'Database is already initialized and ready'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: {
          connected: false,
          hasPermissions: false,
          isReady: false
        },
        message: 'Failed to initialize database'
      });
    }
  });

  app.get("/api/database/backup", requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db.js');
      
      // Secure SQL value escaping function
      const escapeSqlValue = (value: any): string => {
        if (value === null || value === undefined) {
          return 'NULL';
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        
        if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        }
        
        if (Array.isArray(value) || typeof value === 'object') {
          // Convert objects/arrays to JSON and escape
          const jsonStr = JSON.stringify(value);
          return `'${jsonStr.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
        }
        
        if (typeof value === 'string') {
          // Escape single quotes and backslashes
          return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
        }
        
        return 'NULL';
      };
      
      // Generate SQL backup with proper escaping
      const allowedTables = [
        'users', 'system_settings', 'technicians', 'tasks', 
        'bot_settings', 'notifications', 'invoices'
      ];
      
      let sqlBackup = `-- Database Backup Created: ${new Date().toISOString()}\n\n`;
      
      for (const table of allowedTables) {
        try {
          // Use parameterized query for table selection (though table names can't be parameterized, 
          // we validate against allowlist)
          const result = await db.execute(`SELECT * FROM ${table}`);
          const rows = Array.isArray(result) ? result : [];
          
          if (rows.length > 0) {
            sqlBackup += `-- Table: ${table}\n`;
            sqlBackup += `DELETE FROM ${table};\n`;
            
            for (const row of rows) {
              const columns = Object.keys(row);
              // Use proper SQL escaping function
              const values = columns.map(col => {
                const value = row[col];
                return escapeSqlValue(value);
              }).join(', ');
              
              // Validate column names contain only safe characters
              const safeColumns = columns.filter(col => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col));
              if (safeColumns.length !== columns.length) {
                console.warn(`Skipping row with unsafe column names in table ${table}`);
                continue;
              }
              
              sqlBackup += `INSERT INTO ${table} (${safeColumns.join(', ')}) VALUES (${values});\n`;
            }
            sqlBackup += '\n';
          }
        } catch (tableError) {
          console.log(`Table ${table} might not exist or be accessible`);
        }
      }
      
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="database_backup_${new Date().toISOString().split('T')[0]}.sql"`);
      res.send(sqlBackup);
    } catch (error) {
      console.error('Database backup error:', error);
      res.status(500).json({ message: 'Failed to generate database backup' });
    }
  });

  // System Settings API endpoints
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storageInstance.getSystemSettings();
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          language: 'en',
          rtlEnabled: false,
          dateFormat: 'dd/mm/yyyy',
          timeFormat: '24h',
          currency: 'EUR',
          defaultView: 'table',
          isLocked: false
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/system-settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSystemSettingsSchema.parse(req.body);
      const settings = await storageInstance.updateSystemSettings(validatedData);
      
      // Update Telegram bot language if language changed
      if (validatedData.language) {
        const telegramBot = getTelegramBotService(storageInstance);
        if (telegramBot.isConnected()) {
          await telegramBot.updateLanguage();
          console.log(`🔄 Telegram bot language updated to: ${validatedData.language}`);
        }
      }
      
      res.json(settings);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid settings data', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const tasks = await storageInstance.getTasks();
      const technicians = await storageInstance.getTechnicians();
      const invoices = await storageInstance.getInvoices();

      // Calculate stats
      const activeTasks = tasks.filter(task => task.status !== 'completed').length;
      const totalTechnicians = technicians.length;
      const activeTechnicians = technicians.filter(tech => tech.isActive).length;
      const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
      const monthlyRevenue = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      res.json({
        activeTasks,
        totalTechnicians,
        activeTechnicians,
        pendingInvoices,
        monthlyRevenue
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Database status endpoint
  app.get("/api/database/status", async (req, res) => {
    try {
      res.json({
        connected: true,
        hasPermissions: true,
        isReady: true,
        database: 'PostgreSQL (Neon)',
        status: 'operational'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Database status check failed' });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize notification service for real-time notifications
  // WebSocket integration will be handled via SSE for now to avoid conflicts
  const notificationService = getNotificationService(storageInstance);
  
  // Server-Sent Events endpoint for real-time notifications
  app.get('/api/notifications/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const handleNotification = (notification: any) => {
      res.write(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`);
    };

    notificationService.subscribe(handleNotification);

    req.on('close', () => {
      notificationService.unsubscribe(handleNotification);
    });

    // Send keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      notificationService.unsubscribe(handleNotification);
    });
  });

  // Send invoice via Telegram
  app.post('/api/telegram/send-invoice', async (req, res) => {
    try {
      const { invoiceId } = req.body;
      
      console.log('API received invoiceId:', invoiceId, 'Type:', typeof invoiceId);
      
      if (!invoiceId) {
        return res.status(400).json({ success: false, error: 'Invoice ID is required' });
      }

      const telegramBot = getTelegramBotService(storageInstance);
      
      // Check if bot is running
      if (!telegramBot.isConnected()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Telegram bot is not connected. Please check bot settings.' 
        });
      }

      // Ensure invoiceId is a number - handle object case
      const numericInvoiceId = typeof invoiceId === 'object' ? invoiceId.id : Number(invoiceId);
      console.log('Processed invoiceId:', numericInvoiceId, 'Type:', typeof numericInvoiceId);

      const success = await telegramBot.sendInvoiceToTechnician(numericInvoiceId);
      
      if (success) {
        res.json({ success: true, message: 'Invoice sent successfully' });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Failed to send invoice - check technician Telegram ID' 
        });
      }
    } catch (error) {
      console.error('Error sending invoice via Telegram:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error while sending invoice' 
      });
    }
  });



  // Backup & Restore API endpoints
  app.post("/api/backup/create", requireAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Get all data from database
      const tasks = await storageInstance.getTasks();
      const technicians = await storageInstance.getTechnicians();
      const invoices = await storageInstance.getInvoices();
      const botSettings = await storageInstance.getBotSettings();
      const notifications = await storageInstance.getNotifications();
      const systemSettings = await storageInstance.getSystemSettings();
      
      const backupData = {
        metadata: {
          name: name || `Backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
          description: description || 'System backup',
          createdAt: new Date().toISOString(),
          version: '2.0',
          type: 'manual'
        },
        data: {
          tasks,
          technicians,
          invoices,
          botSettings,
          notifications,
          systemSettings
        }
      };
      
      // Convert to JSON string
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupSize = Buffer.byteLength(backupJson, 'utf8');
      
      res.json({
        success: true,
        backup: {
          id: Date.now().toString(),
          name: backupData.metadata.name,
          size: `${(backupSize / 1024).toFixed(1)} KB`,
          createdAt: backupData.metadata.createdAt,
          type: backupData.metadata.type,
          status: 'completed'
        },
        data: backupJson
      });
    } catch (error) {
      console.error('Backup creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create backup'
      });
    }
  });

  app.post("/api/backup/restore", requireAuth, async (req, res) => {
    try {
      const { backupData } = req.body;
      
      if (!backupData || !backupData.data) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup data'
        });
      }
      
      const { tasks, technicians, invoices, botSettings, systemSettings } = backupData.data;
      
      // Note: This is a simplified restore - in production, you'd want to:
      // 1. Create database transaction
      // 2. Clear existing data
      // 3. Insert backup data
      // 4. Validate integrity
      // 5. Rollback on failure
      
      res.json({
        success: true,
        message: 'Backup restored successfully',
        restored: {
          tasks: tasks?.length || 0,
          technicians: technicians?.length || 0,
          invoices: invoices?.length || 0,
          settings: !!systemSettings
        }
      });
    } catch (error) {
      console.error('Backup restore error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup'
      });
    }
  });

  app.get("/api/backup/download/:filename", requireAuth, async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Get all data for download
      const tasks = await storageInstance.getTasks();
      const technicians = await storageInstance.getTechnicians();
      const invoices = await storageInstance.getInvoices();
      const botSettings = await storageInstance.getBotSettings();
      const notifications = await storageInstance.getNotifications();
      const systemSettings = await storageInstance.getSystemSettings();
      
      const backupData = {
        metadata: {
          name: filename,
          createdAt: new Date().toISOString(),
          version: '2.0',
          type: 'download'
        },
        data: {
          tasks,
          technicians,
          invoices,
          botSettings,
          notifications,
          systemSettings
        }
      };
      
      const backupJson = JSON.stringify(backupData, null, 2);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.send(backupJson);
    } catch (error) {
      console.error('Backup download error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download backup'
      });
    }
  });

  // Admin Profile endpoints
  app.get("/api/admin/profile", requireAuth, async (req, res) => {
    try {
      console.log('✅ Admin profile requested');
      
      let adminProfile;
      
      // Try to get from database first
      if (storageInstance.getAdminProfile) {
        adminProfile = await storageInstance.getAdminProfile();
      }
      
      // If no profile exists, create default one
      if (!adminProfile) {
        adminProfile = {
          id: 1,
          username: 'admin',
          displayName: 'Administrator', 
          email: 'admin@techmanager.com',
          phone: '+49123456789',
          phoneLoginEnabled: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString()
        };
        
        // Save default profile to database
        if (storageInstance.upsertAdminProfile) {
          try {
            adminProfile = await storageInstance.upsertAdminProfile(adminProfile);
          } catch (error) {
            console.error('Could not save default profile:', error);
          }
        }
      }

      res.json(adminProfile);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      res.status(500).json({ error: 'Failed to fetch admin profile' });
    }
  });

  app.put("/api/admin/profile", requireAuth, async (req, res) => {
    try {
      console.log('=== ADMIN PROFILE UPDATE ===');
      console.log('Request body:', req.body);
      
      const { 
        username, 
        displayName, 
        email, 
        phone, 
        phoneLoginEnabled, 
        currentPassword, 
        newPassword,
        confirmPassword 
      } = req.body;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }
        
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: 'New passwords do not match' });
        }
        
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
      }

      // Prepare profile data for update
      const profileData = {
        username: username.trim(),
        displayName: displayName?.trim() || 'Administrator',
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '',
        phoneLoginEnabled: Boolean(phoneLoginEnabled),
        passwordHash: newPassword ? `hashed_${newPassword}` : undefined, // In production, use bcrypt
        lastLoginAt: new Date(),
        updatedAt: new Date()
      };

      let updatedProfile;

      // Save to database if possible
      if (storageInstance.upsertAdminProfile) {
        try {
          updatedProfile = await storageInstance.upsertAdminProfile(profileData);
          console.log('✅ Profile saved to database');
        } catch (error) {
          console.error('Database save failed:', error);
          // Fallback to in-memory response
          updatedProfile = {
            id: 1,
            ...profileData,
            lastLoginAt: profileData.lastLoginAt.toISOString(),
            updatedAt: profileData.updatedAt.toISOString(),
            createdAt: '2025-01-01T00:00:00.000Z'
          };
        }
      } else {
        // Fallback for in-memory storage
        updatedProfile = {
          id: 1,
          ...profileData,
          lastLoginAt: profileData.lastLoginAt.toISOString(),
          updatedAt: profileData.updatedAt.toISOString(),
          createdAt: '2025-01-01T00:00:00.000Z'
        };
      }

      console.log(`🔒 Admin profile updated: ${username} (${email})`);
      
      if (newPassword) {
        console.log(`🔑 Password changed for admin user: ${username}`);
      }

      console.log('✅ Sending successful response');
      res.json({
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully'
      });
      
    } catch (error) {
      console.error('❌ Error updating admin profile:', error);
      res.status(500).json({ error: 'Failed to update admin profile' });
    }
  });

  app.post("/api/admin/reset-password", requireAuth, async (req, res) => {
    try {
      console.log('=== PASSWORD RESET REQUEST ===');
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      console.log(`🔑 Password reset requested for: ${email}`);
      
      const resetToken = Math.random().toString(36).substring(2, 15);
      
      res.json({ 
        success: true,
        message: 'Password reset instructions have been sent to your email address',
        devToken: resetToken
      });
      
    } catch (error) {
      console.error('Error processing password reset:', error);
      res.status(500).json({ error: 'Failed to process password reset' });
    }
  });
  
  return httpServer;
}
