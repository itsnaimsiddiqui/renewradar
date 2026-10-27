const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Support loading .env from local project, root directory, or cwd
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];
const envFile = candidateEnvPaths.find(p => fs.existsSync(p));
if (envFile) {
  require('dotenv').config({ path: envFile });
} else {
  require('dotenv').config();
}

const { initDB } = require('./config/db');
const { initTelegramBot } = require('./services/telegramBot');
const { initReminderCron } = require('./services/reminderCron');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'RenewRadar - Domain & Hosting Management API',
    cpanel_node_compatible: true
  });
});

const fs = require('fs');

// Serve frontend static build if available (supports local mono-repo, cPanel root, and VPS subdirectories)
const distCandidates = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, './dist')
];
const frontendDistPath = distCandidates.find(p => fs.existsSync(p)) || distCandidates[0];
app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send(`
    <html>
      <head><title>RenewRadar API Server</title></head>
      <body style="font-family: system-ui; padding: 40px; text-align: center;">
        <h2>📡 RenewRadar API Server Online</h2>
        <p>Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p>Frontend client can be accessed via Vite dev server or by building to <code>frontend/dist</code>.</p>
      </body>
    </html>
  `);
});

// Bootstrapping
async function startServer() {
  try {
    // 0. Startup Security Hygiene Check: Reject unconfigured placeholder secrets
    const FORBIDDEN_PLACEHOLDERS = [
      'your_random_long_secret_key_change_me_in_production',
      'your_random_long_secret_key',
      'your_secure_password',
      'your_secure_admin_password'
    ];
    if (process.env.JWT_SECRET && FORBIDDEN_PLACEHOLDERS.includes(process.env.JWT_SECRET.trim())) {
      console.error('❌ FATAL: JWT_SECRET is set to an example placeholder value.');
      console.error('💡 Please generate a real secret in your .env file using: openssl rand -hex 32');
      process.exit(1);
    }
    if (process.env.ADMIN_PASSWORD && FORBIDDEN_PLACEHOLDERS.includes(process.env.ADMIN_PASSWORD.trim())) {
      console.error('❌ FATAL: ADMIN_PASSWORD is set to an example placeholder value.');
      console.error('💡 Please configure a strong, unique password in your .env file.');
      process.exit(1);
    }

    // 1. Connect or prepare MariaDB
    await initDB();

    // 2. Initialize Telegram Bot
    await initTelegramBot();

    // 3. Initialize Cron Schedulers
    await initReminderCron();

    // 4. Start Listening
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 RenewRadar Server is running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
