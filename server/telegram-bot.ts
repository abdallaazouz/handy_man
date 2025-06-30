import TelegramBot from 'node-telegram-bot-api';
import { IStorage } from './storage';
import { InsertTechnician, InsertNotification } from '../shared/schema';
import { getNotificationService } from './notification-service';
import { translations } from '../client/src/lib/translations';

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private storage: IStorage;
  private isRunning = false;
  private notificationService: any;
  private currentLanguage: 'en' | 'de' | 'ar' = 'ar';
  private botUsername: string | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.notificationService = getNotificationService(storage);
    this.loadSystemLanguage();
  }

  private async loadSystemLanguage(): Promise<void> {
    try {
      const systemSettings = await this.storage.getSystemSettings();
      if (systemSettings?.language) {
        const newLanguage = systemSettings.language as 'en' | 'de' | 'ar';
        if (this.currentLanguage !== newLanguage) {
          this.currentLanguage = newLanguage;
          console.log(`🔄 Bot language updated to: ${this.currentLanguage}`);
        }
      }
    } catch (error) {
      console.log('Using default language (Arabic)');
      this.currentLanguage = 'ar';
    }
  }

  private t(key: string, params?: Record<string, string>): string {
    try {
      const langTranslations: any = translations[this.currentLanguage] || translations.en;
      let text = langTranslations[key] || key;
      
      // Replace parameters if provided
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
        });
      }
      
      return text;
    } catch (error) {
      return key;
    }
  }

  async initialize(token: string): Promise<void> {
    if (this.bot) {
      this.bot.stopPolling();
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.isRunning = true;
    
    // Get bot info to store username
    try {
      const me = await this.bot.getMe();
      this.botUsername = me.username || null;
      console.log(`✅ Bot initialized as @${this.botUsername || 'unknown'}`);
    } catch (error) {
      console.warn('Could not get bot username:', error);
      this.botUsername = null;
    }
    
    // Load current system language
    await this.loadSystemLanguage();
    
    this.setupEventHandlers();
    console.log(`✅ Telegram bot initialized and running (Language: ${this.currentLanguage})`);
  }

  // Add method to update language dynamically
  async updateLanguage(): Promise<void> {
    await this.loadSystemLanguage();
    console.log(`🔄 Bot language updated to: ${this.currentLanguage}`);
  }

  async stop(): Promise<void> {
    if (this.bot && this.isRunning) {
      this.bot.stopPolling();
      this.isRunning = false;
      console.log('🛑 Telegram bot stopped');
    }
  }

  private setupEventHandlers(): void {
    if (!this.bot) return;

    // Handle /start command for new technician registration
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleTechnicianRegistration(msg);
    });

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    // Handle text messages
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.handleTextMessage(msg);
      }
    });

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    // Polling error handling
    this.bot.on('polling_error', (error) => {
      console.error('[polling_error]', error);
      if (error.message.includes('404')) {
        console.error('❌ Bot token is invalid or bot does not exist');
        // Don't set isRunning to false here as it may be a temporary issue
        // The bot will be restarted when settings are updated
      }
    });
  }

  private async handleTechnicianRegistration(msg: any): Promise<void> {
    if (!this.bot) return;

    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const firstName = msg.from.first_name || 'Unknown';
    const lastName = msg.from.last_name || '';
    const username = msg.from.username || '';

    try {
      // Check if technician already exists
      const existingTechnician = await this.storage.getTechnicianByTelegramId(telegramId);
      
      if (existingTechnician) {
        await this.loadSystemLanguage(); // Refresh language settings
        const statusText = existingTechnician.isActive ? 
          this.t('common.active') : this.t('common.inactive');
        
        await this.bot.sendMessage(chatId, 
          this.t('bot.welcome_message', {
            name: `${existingTechnician.firstName} ${existingTechnician.lastName || ''}`,
            status: statusText
          })
        );
        return;
      }

      // Create new technician
      const newTechnician: InsertTechnician = {
        telegramId,
        firstName,
        lastName: lastName || undefined,
        username: username || undefined,
        isActive: true
      };

      const technician = await this.storage.createTechnician(newTechnician);

      // Send welcome message
      await this.bot.sendMessage(chatId,
        `مرحباً ${firstName}! تم تسجيلك بنجاح في نظام إدارة المهام.\n\n` +
        `معرف المستخدم: ${technician.id}\n` +
        `الاسم: ${firstName} ${lastName}\n` +
        `معرف التليجرام: @${username || 'غير محدد'}\n\n` +
        `سيتم إرسال المهام الجديدة إليك هنا. يمكنك قبول أو رفض كل مهمة.`
      );

      // Create system notification
      await this.storage.createNotification({
        type: 'technician_registered',
        message: `New technician registered: ${firstName} ${lastName} (@${username})`,
        isRead: false
      });

      console.log(`✅ New technician registered: ${firstName} ${lastName} (ID: ${technician.id})`);

    } catch (error) {
      console.error('Error registering technician:', error);
      await this.bot.sendMessage(chatId, 
        'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى لاحقاً.'
      );
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    if (!this.bot || !query.data) return;

    const chatId = query.message.chat.id;
    const data = JSON.parse(query.data);
    const action = data.action;
    const taskId = data.taskId;

    try {
      switch (action) {
        case 'accept_task':
          await this.handleTaskAcceptance(chatId, taskId, query.from);
          break;
        case 'reject_task':
          await this.handleTaskRejection(chatId, taskId, query.from);
          break;
        case 'complete_task':
          await this.handleTaskCompletion(chatId, taskId, query.from);
          break;
      }

      // Answer the callback query to remove loading state
      await this.bot.answerCallbackQuery(query.id);

    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.bot.answerCallbackQuery(query.id, {
        text: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
        show_alert: true
      });
    }
  }

  private async handleTaskAcceptance(chatId: number, taskId: string, user: any): Promise<void> {
    if (!this.bot) return;

    try {
      const task = await this.storage.getTask(parseInt(taskId));
      if (!task) {
        await this.bot.sendMessage(chatId, 'المهمة غير موجودة.');
        return;
      }

      // Update task status to accepted
      await this.storage.updateTask(task.id, { status: 'accepted' });

      // Send confirmation to technician
      await this.loadSystemLanguage(); // Refresh language settings
      await this.bot.sendMessage(chatId,
        this.t('bot.task_accepted', {
          taskId: task.taskNumber,
          title: task.title
        })
      );

      // Create system notification with immediate delivery
      await this.notificationService.createNotification({
        type: 'task_accepted',
        message: `Task ${task.taskNumber} accepted by ${user.first_name} ${user.last_name || ''}`,
        isRead: false
      });

      // Log activity
      await this.notificationService.logActivity('task_accepted', 
        `Task ${task.taskNumber} accepted by technician ${user.first_name}`, 
        { taskId: task.id, technicianName: `${user.first_name} ${user.last_name || ''}` }
      );

      console.log(`✅ Task ${task.taskNumber} accepted by technician ${user.first_name}`);

    } catch (error) {
      console.error('Error handling task acceptance:', error);
      await this.bot.sendMessage(chatId, 'حدث خطأ أثناء قبول المهمة.');
    }
  }

  private async handleTaskRejection(chatId: number, taskId: string, user: any): Promise<void> {
    if (!this.bot) return;

    try {
      const task = await this.storage.getTask(parseInt(taskId));
      if (!task) {
        await this.bot.sendMessage(chatId, 'المهمة غير موجودة.');
        return;
      }

      // Update task status to rejected
      await this.storage.updateTask(task.id, { status: 'rejected' });

      // Send confirmation to technician
      await this.bot.sendMessage(chatId,
        `❌ تم رفض المهمة.\n\n` +
        `رقم المهمة: ${task.taskNumber}\n` +
        `العنوان: ${task.title}\n\n` +
        `شكراً لك على الرد.`
      );

      // Create system notification with immediate delivery
      await this.notificationService.createNotification({
        type: 'task_rejected',
        message: `Task ${task.taskNumber} rejected by ${user.first_name} ${user.last_name || ''}`,
        isRead: false
      });

      // Log activity
      await this.notificationService.logActivity('task_rejected', 
        `Task ${task.taskNumber} rejected by technician ${user.first_name}`, 
        { taskId: task.id, technicianName: `${user.first_name} ${user.last_name || ''}` }
      );

      console.log(`❌ Task ${task.taskNumber} rejected by technician ${user.first_name}`);

    } catch (error) {
      console.error('Error handling task rejection:', error);
      await this.bot.sendMessage(chatId, 'حدث خطأ أثناء رفض المهمة.');
    }
  }

  private async handleTaskCompletion(chatId: number, taskId: string, user: any): Promise<void> {
    if (!this.bot) return;

    try {
      const task = await this.storage.getTask(parseInt(taskId));
      if (!task) {
        await this.bot.sendMessage(chatId, 'المهمة غير موجودة.');
        return;
      }

      // Update task status to completed
      await this.storage.updateTask(task.id, { status: 'completed' });

      // Send confirmation to technician
      await this.loadSystemLanguage(); // Refresh language settings
      await this.bot.sendMessage(chatId,
        this.t('bot.task_completed', {
          taskId: task.taskNumber,
          title: task.title
        })
      );

      // Create system notification with immediate delivery
      await this.notificationService.createNotification({
        type: 'task_completed',
        message: `Task ${task.taskNumber} marked as completed by ${user.first_name} ${user.last_name || ''}`,
        isRead: false
      });

      // Log activity
      await this.notificationService.logActivity('task_completed', 
        `Task ${task.taskNumber} completed by technician ${user.first_name}`, 
        { taskId: task.id, technicianName: `${user.first_name} ${user.last_name || ''}` }
      );

      console.log(`✅ Task ${task.taskNumber} completed by technician ${user.first_name}`);

    } catch (error) {
      console.error('Error handling task completion:', error);
      await this.bot.sendMessage(chatId, 'حدث خطأ أثناء تأكيد إنجاز المهمة.');
    }
  }

  private async handleTextMessage(msg: any): Promise<void> {
    if (!this.bot) return;

    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId,
      'مرحباً! استخدم الأزرار للتفاعل مع المهام.\n\n' +
      'إذا كنت تواجه مشكلة، يرجى التواصل مع الإدارة.'
    );
  }

  // Public methods for sending notifications

  async sendTaskToTechnician(taskId: number, technicianId: number): Promise<boolean> {
    if (!this.bot || !this.isRunning) {
      console.error('Bot is not running');
      return false;
    }

    try {
      // Force reload system language from database
      await this.loadSystemLanguage();
      console.log(`🔄 Bot sending message in language: ${this.currentLanguage}`);
      
      const task = await this.storage.getTask(taskId);
      const technician = await this.storage.getTechnician(technicianId);

      if (!task || !technician) {
        console.error('Task or technician not found');
        return false;
      }

      const chatId = parseInt(technician.telegramId);
      
      const taskMessage = this.t('bot.new_task_message', {
        taskId: task.taskNumber,
        title: task.title,
        description: task.description,
        location: task.location,
        date: task.scheduledDate,
        time: `${task.scheduledTimeFrom} - ${task.scheduledTimeTo}`
      });

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: `✅ ${this.t('bot.button_accept')}`,
              callback_data: JSON.stringify({ action: 'accept_task', taskId: task.id.toString() })
            },
            {
              text: `❌ ${this.t('bot.button_reject')}`,
              callback_data: JSON.stringify({ action: 'reject_task', taskId: task.id.toString() })
            }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, taskMessage, { reply_markup: keyboard });

      // Update task status to sent
      await this.storage.updateTask(taskId, { status: 'sent' });

      // Create system notification
      await this.storage.createNotification({
        type: 'task_sent',
        message: `Task ${task.taskNumber} sent to ${technician.firstName} ${technician.lastName || ''}`,
        isRead: false
      });

      console.log(`📤 Task ${task.taskNumber} sent to technician ${technician.firstName}`);
      return true;

    } catch (error) {
      console.error('Error sending task to technician:', error);
      return false;
    }
  }

  async sendClientInfoToTechnician(taskId: number, technicianId: number): Promise<boolean> {
    if (!this.bot || !this.isRunning) {
      console.error('Bot is not running');
      return false;
    }

    try {
      // Always refresh language settings before sending messages
      await this.loadSystemLanguage();
      
      const task = await this.storage.getTask(taskId);
      const technician = await this.storage.getTechnician(technicianId);

      if (!task || !technician) {
        console.error('Task or technician not found');
        return false;
      }

      const chatId = parseInt(technician.telegramId);
      
      const clientMessage = this.t('bot.client_info_message', {
        clientName: task.clientName,
        clientPhone: task.clientPhone,
        location: task.location,
        mapLink: task.mapUrl || '',
        description: task.description
      });

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: `✅ ${this.t('bot.button_complete')}`,
              callback_data: JSON.stringify({ action: 'complete_task', taskId: task.id.toString() })
            }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, clientMessage, { reply_markup: keyboard });

      // Create system notification
      await this.storage.createNotification({
        type: 'client_info_sent',
        message: `Client info sent for task ${task.taskNumber} (${task.clientName})`,
        isRead: false
      });

      console.log(`📤 Client info sent for task ${task.taskNumber} to technician ${technician.firstName}`);
      return true;

    } catch (error) {
      console.error('Error sending client info to technician:', error);
      return false;
    }
  }

  async sendInvoiceToTechnician(invoiceId: number): Promise<boolean> {
    if (!this.bot || !this.isRunning) {
      console.error('Bot is not running');
      return false;
    }

    try {
      // Always refresh language settings before sending messages
      await this.loadSystemLanguage();
      
      console.log('Getting invoice with ID:', invoiceId, 'Type:', typeof invoiceId);
      // Ensure invoiceId is definitely a number
      const numericId = Number(invoiceId);
      if (isNaN(numericId)) {
        console.error('Invalid invoice ID:', invoiceId);
        return false;
      }
      
      const invoice = await this.storage.getInvoice(numericId);
      if (!invoice) {
        console.error('Invoice not found');
        return false;
      }

      const technician = await this.storage.getTechnician(parseInt(invoice.technicianId));
      if (!technician) {
        console.error('Technician not found');
        return false;
      }

      const task = await this.storage.getTasksByTechnician(parseInt(invoice.technicianId))
        .then(tasks => tasks.find(t => t.taskId === invoice.taskId));

      const chatId = parseInt(technician.telegramId);

      const invoiceMessage = `📄 *${this.t('bot.invoice_received')}*\n\n` +
        `🧾 ${this.t('bot.invoice_number')}: ${invoice.invoiceNumber}\n` +
        `💰 ${this.t('bot.amount')}: €${invoice.amount}\n` +
        `👤 ${this.t('bot.client')}: ${invoice.clientName}\n` +
        `📅 ${this.t('bot.due_date')}: ${invoice.dueDate}\n` +
        `📊 ${this.t('bot.status')}: ${invoice.status}\n\n` +
        `${this.t('bot.invoice_instructions')}`;

      await this.bot.sendMessage(chatId, invoiceMessage, { parse_mode: 'Markdown' });

      // Create system notification
      await this.storage.createNotification({
        type: 'invoice_sent',
        message: `Invoice ${invoice.invoiceNumber} sent to ${technician.firstName} ${technician.lastName || ''}`,
        isRead: false
      });

      console.log(`📧 Invoice ${invoice.invoiceNumber} sent to technician ${technician.firstName}`);
      
      // Create notification
      await this.notificationService?.createNotification({
        type: 'invoice_sent',
        message: `Invoice ${invoice.invoiceNumber} sent to ${technician.firstName}`,
        metadata: JSON.stringify({ invoiceId, technicianId: technician.id }),
        isRead: false
      });

      return true;

    } catch (error) {
      console.error('Error sending invoice to technician:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.bot !== null && this.isRunning;
  }

  getBotUsername(): string | null {
    return this.botUsername;
  }

  async testConnection(): Promise<boolean> {
    if (!this.bot) return false;
    
    try {
      const me = await this.bot.getMe();
      return true;
    } catch (error) {
      console.error('Bot connection test failed:', error);
      return false;
    }
  }

  async sendInvoicePDF(technicianId: string, pdfBuffer: Buffer, fileName: string, message: string): Promise<boolean> {
    try {
      if (!this.bot || !this.isRunning) {
        console.log('❌ Bot is not running');
        return false;
      }

      console.log('Sending PDF to technician:', technicianId);
      console.log('File name:', fileName);
      console.log('Message:', message);

      // Send the PDF document
      await this.bot.sendDocument(technicianId, pdfBuffer, {
        caption: message,
      }, {
        filename: fileName,
        contentType: 'application/pdf'
      });

      console.log('✅ Invoice PDF sent successfully to technician:', technicianId);
      return true;

    } catch (error: any) {
      console.error('❌ Error sending invoice PDF:', error);
      
      // Try to send error message to technician
      try {
        if (this.bot) {
          await this.bot.sendMessage(technicianId, 
            `خطأ في إرسال الفاتورة: ${error.message}`
          );
        }
      } catch (msgError) {
        console.error('❌ Error sending error message:', msgError);
      }
      
      return false;
    }
  }
}

// Singleton instance
let telegramBotService: TelegramBotService | null = null;

export function getTelegramBotService(storage: IStorage): TelegramBotService {
  if (!telegramBotService) {
    telegramBotService = new TelegramBotService(storage);
  }
  return telegramBotService;
}