const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building application for production...');

// Build the frontend
console.log('Building frontend...');
execSync('npm run build:client', { stdio: 'inherit' });

// Create production package.json
const prodPackageJson = {
  "name": "task-management-system",
  "version": "1.0.0",
  "description": "Task and Invoice Management System",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.4",
    "drizzle-orm": "^0.30.10",
    "drizzle-zod": "^0.5.1",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "connect-pg-simple": "^9.0.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "zod": "^3.23.8",
    "zod-validation-error": "^3.3.0",
    "ws": "^8.17.1"
  }
};

// Copy necessary files to dist directory
const distDir = './dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write production package.json
fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(prodPackageJson, null, 2)
);

// Copy server files
console.log('Copying server files...');
const serverFiles = ['server', 'shared', 'drizzle.config.ts'];
serverFiles.forEach(file => {
  execSync(`cp -r ${file} ${distDir}/`, { stdio: 'inherit' });
});

// Copy built client to dist/public
execSync(`cp -r dist-client ${distDir}/public`, { stdio: 'inherit' });

console.log('✅ Build complete! Production files are in ./dist');
console.log('📦 Ready for deployment to Hostinger');