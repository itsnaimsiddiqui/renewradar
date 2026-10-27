# RenewRadar - Comprehensive Setup & Deployment Guide

This guide covers step-by-step instructions for deploying RenewRadar across two primary production targets (**VPS Installation** and **Docker Compose**), along with database initialization, Telegram Bot setup, first administrator login, and custom branding.

---

## 📋 System Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` `v10.x` or later
- **Database**: `MariaDB 10.4+` or `MySQL 8.0+`
- **Operating System**: Linux (Ubuntu 22.04 / 24.04 LTS, Debian 12, CentOS / Rocky Linux) or macOS / Windows with WSL2

---

## 🚀 Target 1: Production VPS Installation

### 1. Install Node.js (v20 LTS) & Process Manager (PM2)
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify installation
node -v   # Expected: v20.x.x
npm -v    # Expected: v10.x.x

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Install & Secure MariaDB Server
```bash
# Install MariaDB server
sudo apt install -y mariadb-server mariadb-client

# Start and enable MariaDB service
sudo systemctl enable --now mariadb

# Run security wizard
sudo mysql_secure_installation
```

### 3. Create Database & User
Log into MariaDB as root:
```bash
sudo mysql -u root -p
```
Run the following SQL commands:
```sql
CREATE DATABASE IF NOT EXISTS renewradar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'renewradar_user'@'localhost' IDENTIFIED BY 'your_secure_db_password';
GRANT ALL PRIVILEGES ON renewradar_db.* TO 'renewradar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Import Schema & Seed Data
Navigate to the project root:
```bash
# Import schema (creates all tables, foreign keys, and indexes)
mysql -u renewradar_user -p renewradar_db < database/schema.sql

# (Optional) Import demo seed data
mysql -u renewradar_user -p renewradar_db < database/seed.sql
```

### 5. Configure & Start Node.js Express API
```bash
cd "Node Express Project" # or backend/

# Install dependencies using pinned lockfile
npm ci --omit=dev

# Create environment file from template
cp .env.example .env

# Edit .env with your database credentials and secret keys
nano .env
```
Ensure your `.env` contains:
```env
PORT=5001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=renewradar_user
DB_PASSWORD=your_secure_db_password
DB_NAME=renewradar_db
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password
JWT_SECRET=your_random_32_character_jwt_secret_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_numeric_chat_id_here
ALERT_CRON="0 9 * * *"
ALERT_TIERS=30,15,7,3,1,0
```

Start the API with PM2:
```bash
pm2 start src/server.js --name renewradar-api
pm2 save
pm2 startup
```

### 6. Build the React/Vite Frontend
```bash
cd "../React Vite Project" # or frontend/

# Install dependencies using pinned lockfile
npm ci

# Configure production API endpoint
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production

# Compile production bundle
npm run build
```
The compiled static assets are located in `dist/`.

### 7. Configure Nginx Reverse Proxy
Install Nginx:
```bash
sudo apt install -y nginx
```
Create `/etc/nginx/sites-available/renewradar`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend Single Page App
    root /var/www/renewradar/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
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
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/renewradar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐳 Target 2: Docker & Docker Compose Installation

RenewRadar includes a turnkey `docker-compose.yml` that configures the entire stack (MariaDB, Node API, and Web server) in containers.

### 1. Clone & Configure
```bash
# Copy example environment configuration
cp .env.example .env

# Edit .env to supply your production secrets and DB passwords
nano .env
```

### 2. Start the Stack
```bash
docker compose up -d --build
```

### 3. Verify Containers
```bash
docker compose ps
docker compose logs -f api
```

The services will be reachable at:
- **Web Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:5001/api/health`
- **MariaDB**: `127.0.0.1:3306` (bound securely to localhost)

---

## 🤖 Telegram Bot Setup (Polling & Webhook)

RenewRadar supports automated Telegram notifications and interactive bot commands (`/start`, `/status`, `/expiring`, `/summary`).

1. **Create the Bot**:
   - Open Telegram and search for `@BotFather`.
   - Send `/newbot` and follow instructions to name your bot.
   - Copy the HTTP API token provided by BotFather.
2. **Retrieve Your Admin Chat ID**:
   - Open Telegram and search for `@userinfobot`.
   - Send `/start`. The bot will reply with your numeric Chat ID.
3. **Configure the Bot in RenewRadar**:
   - Either place the token and chat ID into `.env`:
     ```env
     TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
     TELEGRAM_ADMIN_CHAT_ID=your_numeric_admin_chat_id
     ```
   - Or configure it directly live in the web UI under **Settings → Telegram Configuration**.
4. **Polling Mode**:
   - Default mode is long-polling (`polling: true`), requiring no public SSL certificate or webhook configuration.
   - Simply start the backend, send `/start` to your Telegram bot, and it will respond with the interactive RenewRadar menu.

---

## 🔐 First Administrator Login

1. Open your browser and navigate to the application URL (or `http://localhost:5173` in local development).
2. Enter the administrator credentials you defined in your `.env`:
   - **Username**: The value of `ADMIN_USERNAME`
   - **Password**: The value of `ADMIN_PASSWORD`
3. Click **Sign In**.
4. To change the administrator credentials:
   - Open `.env` in the backend project.
   - Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` to your preferred values.
   - Restart the backend process: `pm2 restart renewradar-api`.

---

## 🎨 How to Customize Branding

RenewRadar is designed for full white-label customization:

1. **Brand Name & Document Title**:
   - Change `<title>RenewRadar | Domain & Hosting Radar</title>` in `frontend/index.html`.
   - Update the logo text and subtitle in `frontend/src/App.jsx`:
     ```jsx
     <span className="font-extrabold text-slate-900 tracking-tight text-lg">YourAgencyRadar</span>
     ```
2. **Brand Theme & Colors**:
   - Tailor primary brand colors in `frontend/tailwind.config.js`:
     ```js
     theme: {
       extend: {
         colors: {
           brand: '#2563eb', // Change to your agency primary hex
         }
       }
     }
     ```
3. **Favicon & Icons**:
   - Replace `frontend/public/favicon.ico` or update the SVG logo icon inside `frontend/src/App.jsx`.
4. **Default Notification Sender**:
   - Edit the header banner inside `backend/src/services/telegramBot.js` (`🔔 RenewRadar - Expiry Alert`).
