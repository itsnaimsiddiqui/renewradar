# RenewRadar - cPanel & Production Deployment Guide

This guide explains step-by-step how to deploy **RenewRadar** on any cPanel shared, VPS, or dedicated hosting server.

### System Requirements:
- **Node.js:** `18.x`, `20.x`, or `22.x`
- **Database:** MariaDB `10.4+` or MySQL `8.0+`
- **Web Server:** Apache with `mod_rewrite` & `mod_proxy` (Standard on almost all cPanel hosts)

---

## Step 1: Create Database & Import Schema

1. Log into your **cPanel** dashboard.
2. Under the **Databases** section, click on **MySQL® Databases**:
   - In **Create New Database**, enter a name (e.g. `yourprefix_renewradar`).
   - In **Add User to Database**, select your database user and database, then click **Add**.
   - Check **ALL PRIVILEGES** and click **Make Changes**.
3. Under the **Databases** section, open **phpMyAdmin**:
   - Select your newly created database from the left sidebar.
   - Click the **Import** tab at the top.
   - Click **Choose File** and select `backend/src/models/schema.sql` from this package.
   - Click **Import / Go** at the bottom to generate the tables and initial seed data.

---

## Step 2: Configure "Setup Node.js App" in cPanel

1. In cPanel, search for and click on **Setup Node.js App** (under the Software section).
2. Click **Create Application**:
   - **Node.js version:** Select `20.x` or `22.x`.
   - **Application mode:** Select `Production`.
   - **Application root:** `renewradar` (or your chosen directory).
   - **Application URL:** Select your domain or subdomain (e.g., `radar.youragency.com`).
   - **Application startup file:** `src/server.js`
   - Click **Create**.
3. Once the app is created, upload the files inside the `backend/` folder into your `renewradar` directory via cPanel **File Manager** or FTP.
4. Also upload the pre-compiled `frontend/dist` directory into `frontend/dist` so the single Node process serves both the web frontend and API seamlessly on one port.

---

## Step 3: Configure Environment (.env)

In your application root (`renewradar/.env`), copy `.env.example` to `.env` and fill in your DB credentials:

```env
PORT=5001
NODE_ENV=production

# Database (MariaDB / MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_random_long_secret_key

# Telegram Bot (Optional: You can also configure this directly in the Web UI Settings!)
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=

REMINDER_TIERS=30,15,7,3,1,0
CRON_SCHEDULE="0 9 * * *"
```

> **Tip:** You do not even have to manually enter the Telegram Bot credentials here! You can launch the app, log into the dashboard, and configure the Bot Token, Chat ID, and alert schedules directly from the **Telegram Hub** tab in the UI.

---

## Step 4: Install Dependencies & Start the App

1. In cPanel **Setup Node.js App**, click **Run NPM Install**.
2. Click **Restart Application**.
3. Visit your domain — RenewRadar is now live!

---

## Step 5: Apache Reverse Proxy (.htaccess)

If you are running the Node.js application on a domain/subdomain root, make sure your `.htaccess` file in that folder forwards web traffic to the internal Node process:

```apache
# Apache 2.4 Reverse Proxy for RenewRadar
DirectoryIndex disabled
RewriteEngine On

# Proxy to internal Node port
RewriteRule ^$ http://127.0.0.1:5001/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5001/$1 [P,L]
```

---

## Step 6: Easy Telegram Bot Setup

Inside the **Telegram & Bot** tab in the RenewRadar web interface:
1. Open `@BotFather` on Telegram and send `/newbot` to create your bot and copy the **HTTP API Token**.
2. Open `@userinfobot` on Telegram and send `/start` to get your numeric **Chat ID**.
3. Paste both into the **Bot Credentials** form in the dashboard and click **Save & Connect Bot**.
4. Click **Dispatch Test Alert** to verify your connection!
