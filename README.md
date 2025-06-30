# Technician Task Manager
## مدير مهام الفنيين

A comprehensive multi-language task and invoicing management platform with Telegram bot integration for technician workflow automation.

نظام إدارة مهام وفواتير شامل متعدد اللغات مع تكامل بوت تيليجرام لأتمتة سير عمل الفنيين.

## 🌟 Features / الميزات

### Core Features / الميزات الأساسية
- **Multi-language Support** / دعم متعدد اللغات (العربية، الإنجليزية، الألمانية)
- **RTL Layout Support** / دعم التخطيط من اليمين لليسار
- **Telegram Bot Integration** / تكامل بوت تيليجرام
- **Real-time Notifications** / إشعارات فورية
- **Invoice Management** / إدارة الفواتير
- **Task Assignment** / تخصيص المهام
- **Technician Management** / إدارة الفنيين
- **Comprehensive Reports** / تقارير شاملة
- **Data Export (PDF/Excel/CSV)** / تصدير البيانات
- **Backup & Restore** / النسخ الاحتياطي والاستعادة

### Technical Features / الميزات التقنية
- **Dark/Light Theme** / الوضع المظلم/المضيء
- **Responsive Design** / تصميم متجاوب
- **Audio Notifications** / إشعارات صوتية
- **Progressive Web App** / تطبيق ويب تقدمي
- **TypeScript Support** / دعم TypeScript
- **PostgreSQL Database** / قاعدة بيانات PostgreSQL

## 🚀 Tech Stack / المكدس التقني

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Wouter** for routing
- **TanStack Query** for state management
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Node.js 20** runtime
- **WebSocket** for real-time updates

### External Integrations
- **Telegram Bot API** for technician communication
- **jsPDF** for PDF generation
- **XLSX** for Excel export

## 📦 Installation / التثبيت

### Prerequisites / المتطلبات
- Node.js 20 or later
- PostgreSQL 16
- npm or yarn

### Setup / الإعداد

1. **Clone the repository / استنساخ المستودع**
```bash
git clone https://github.com/ahmedapaly2025/technician-task-manager.git
cd technician-task-manager
```

2. **Install dependencies / تثبيت التبعيات**
```bash
npm install
```

3. **Environment Variables / متغيرات البيئة**
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/technician_db
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NODE_ENV=development
```

4. **Database Setup / إعداد قاعدة البيانات**
```bash
npm run db:push
npm run db:seed
```

5. **Start Development Server / تشغيل خادم التطوير**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Configuration / التكوين

### Telegram Bot Setup / إعداد بوت تيليجرام
1. Create a new bot with @BotFather on Telegram
2. Get your bot token
3. Add the token to your environment variables
4. Configure bot settings in the admin panel

### Database Configuration / تكوين قاعدة البيانات
The application uses PostgreSQL with Drizzle ORM. Schema is automatically synchronized using:
```bash
npm run db:push
```

## 📖 Usage / الاستخدام

### Admin Panel / لوحة الإدارة
- Access the admin panel at `/login`
- Default credentials: `admin` / `admin123`
- Manage technicians, tasks, and invoices
- Configure system settings and bot integration

### Telegram Bot Commands / أوامر بوت تيليجرام
- `/start` - Register as a technician
- `/tasks` - View assigned tasks
- `/accept [task_id]` - Accept a task
- `/complete [task_id]` - Mark task as completed

### API Endpoints / نقاط API
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/technicians` - Get all technicians
- `POST /api/invoices` - Create invoice
- `GET /api/reports/export` - Export data

## 🌍 Internationalization / التدويل

The application supports:
- **Arabic (العربية)** - RTL layout
- **English** - Default language
- **German (Deutsch)** - Additional language

Language files are located in `client/src/lib/translations/`

## 🛠️ Development / التطوير

### Project Structure / هيكل المشروع
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and translations
│   │   └── hooks/         # Custom hooks
├── server/                # Backend Express application
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data layer
│   ├── telegram-bot.ts   # Telegram integration
│   └── db.ts             # Database connection
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema
└── package.json
```

### Available Scripts / الأوامر المتاحة
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema changes
npm run db:studio    # Open database studio
npm run type-check   # TypeScript type checking
```

## 📊 Database Schema / مخطط قاعدة البيانات

### Main Tables / الجداول الرئيسية
- **users** - Admin users
- **technicians** - Telegram registered technicians
- **tasks** - Work assignments
- **invoices** - Payment tracking
- **notifications** - System notifications
- **bot_settings** - Telegram bot configuration
- **system_settings** - Application settings

## 🔐 Security / الأمان

- SQL injection protection with parameterized queries
- Input validation using Zod schemas
- Authentication middleware
- Environment variable protection
- CORS configuration
- Rate limiting (recommended for production)

## 📈 Performance / الأداء

- React Query for efficient data fetching
- Lazy loading for components
- Optimized bundle size
- Database indexing
- Connection pooling

## 🚀 Deployment / النشر

### Production Deployment / النشر للإنتاج
1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Configure reverse proxy (nginx recommended)
4. Set up SSL certificates
5. Configure database backups

### Docker Deployment (Optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing / المساهمة

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License / الترخيص

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support / الدعم

For support and questions:
- Create an issue on GitHub
- Contact: ahmedapaly2025@gmail.com

## 📝 Changelog / سجل التغييرات

See [CHANGELOG.md](CHANGELOG.md) for detailed changes and version history.

## 🙏 Acknowledgments / شكر وتقدير

- React team for the amazing framework
- Drizzle team for the excellent ORM
- Radix UI for accessible components
- Tailwind CSS for utility-first styling
- Telegram Bot API for seamless integration

---

Made with ❤️ by Ahmed Apaly | صُنع بـ ❤️ بواسطة أحمد أبالي