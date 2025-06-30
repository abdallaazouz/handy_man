# استخدام Node.js 20 كصورة أساسية
FROM node:20-alpine

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات package.json
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production

# نسخ ملفات المشروع
COPY . .

# بناء المشروع
RUN npm run build

# تعيين المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["npm", "start"]