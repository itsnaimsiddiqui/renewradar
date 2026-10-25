const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

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

// Serve frontend static build if available (e.g. for single-deployment setup on cPanel)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  const fs = require('fs');
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
