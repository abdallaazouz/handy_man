# دليل نشر Technician Task Manager على DigitalOcean

## الطريقة الأولى: App Platform (الأسهل والموصى بها)

### 1. إنشاء حساب GitHub ورفع الكود
```bash
# إنشاء مستودع جديد على GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/technician-task-manager.git
git push -u origin main
```

### 2. إنشاء التطبيق على DigitalOcean
1. اذهب إلى [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. انقر على "Create App"
3. اختر "GitHub" كمصدر
4. اختر المستودع الخاص بك
5. اختر البرانش "main"
6. انقر "Next"

### 3. تكوين التطبيق
- **Service Type**: Web Service
- **Source Directory**: / (الجذر)
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: 5000
- **Environment**: Node.js

### 4. إضافة قاعدة البيانات
1. في صفحة التكوين، انقر "Add Database"
2. اختر "PostgreSQL"
3. اختر الحجم المناسب (Dev Database للاختبار)
4. انقر "Create"

### 5. متغيرات البيئة
أضف هذه المتغيرات في قسم Environment Variables:
```
NODE_ENV=production
DATABASE_URL=${db.DATABASE_URL}
```

### 6. النشر
1. راجع التكوين
2. انقر "Create Resources"
3. انتظر حتى اكتمال البناء والنشر

## الطريقة الثانية: Droplet مع Docker

### 1. إنشاء Droplet
1. اذهب إلى [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
2. انقر "Create Droplet"
3. اختر Ubuntu 22.04 LTS
4. اختر الحجم المناسب (Basic $6/month للبداية)
5. اختر منطقة قريبة من المستخدمين
6. أضف SSH Key أو استخدم كلمة مرور

### 2. تثبيت Docker على الخادم
```bash
# الاتصال بالخادم
ssh root@your-server-ip

# تحديث النظام
apt update && apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. إعداد قاعدة البيانات
```bash
# إنشاء شبكة Docker
docker network create app-network

# تشغيل PostgreSQL
docker run -d \
  --name postgres-db \
  --network app-network \
  -e POSTGRES_DB=techmanager \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secure_password_123 \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:14
```

### 4. نشر التطبيق
```bash
# نسخ الملفات للخادم
scp -r . root@your-server-ip:/app

# على الخادم
cd /app

# بناء الصورة
docker build -t technician-task-manager .

# تشغيل التطبيق
docker run -d \
  --name tech-manager-app \
  --network app-network \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://admin:secure_password_123@postgres-db:5432/techmanager \
  -p 80:5000 \
  technician-task-manager
```

### 5. إعداد النطاق والـ SSL
```bash
# تثبيت Nginx
apt install nginx -y

# تكوين Nginx
cat > /etc/nginx/sites-available/tech-manager << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# تفعيل الموقع
ln -s /etc/nginx/sites-available/tech-manager /etc/nginx/sites-enabled/
systemctl restart nginx

# تثبيت SSL مع Let's Encrypt
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

## الطريقة الثالثة: Docker Compose (الأفضل للإنتاج)

### 1. إنشاء ملف docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://admin:secure_password_123@db:5432/techmanager
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=techmanager
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secure_password_123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2. تشغيل التطبيق
```bash
# على الخادم
docker-compose up -d
```

## التكلفة التقديرية

### App Platform
- **Basic Plan**: $5/شهر للتطبيق
- **Dev Database**: $7/شهر لقاعدة البيانات
- **المجموع**: ~$12/شهر

### Droplet
- **Basic Droplet**: $6/شهر (1GB RAM, 1 vCPU)
- **Regular Droplet**: $12/شهر (2GB RAM, 1 vCPU) - موصى به
- **Premium Droplet**: $24/شهر (4GB RAM, 2 vCPU)

## نصائح مهمة

1. **النسخ الاحتياطية**: فعل النسخ الاحتياطية التلقائية
2. **المراقبة**: استخدم DigitalOcean Monitoring
3. **الأمان**: فعل الجدار الناري (UFW)
4. **التحديثات**: جدول التحديثات التلقائية
5. **النطاق**: اربط نطاق مخصص للمظهر الاحترافي

## الخيار الموصى به

للبدء السريع، استخدم **App Platform** لأنه:
- أسهل في الإعداد
- يدير التحديثات تلقائياً
- يشمل SSL مجاني
- مراقبة مدمجة
- نسخ احتياطية تلقائية

هل تريد المساعدة في أي من هذه الطرق؟