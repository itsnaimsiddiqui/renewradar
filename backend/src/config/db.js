const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

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

const mockData = require('./mockData');

let pool = null;
let isMock = false;

async function initDB() {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbPassword = process.env.DB_PASSWORD;

  if (isProduction && !dbPassword) {
    throw new Error('FATAL: DB_PASSWORD environment variable is required in production.');
  }

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: dbPassword || '',
    database: process.env.DB_NAME || 'renewradar_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000
  };

  try {
    const testConn = await mysql.createConnection(dbConfig);
    await testConn.ping();
    await testConn.end();

    pool = mysql.createPool(dbConfig);
    isMock = false;
    console.log(`✅ [MariaDB] Successfully connected to MariaDB: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  } catch (err) {
    if (isProduction) {
      console.error(`❌ [MariaDB] Database connection failure in production: ${err.message}`);
      throw new Error(`Database connection failed: ${err.message}`);
    }
    console.warn(`⚠️ [MariaDB] Could not connect to live MariaDB (${err.message}).`);
    console.warn(`💡 [Notice] Running with In-Memory Mock Store for rapid local prototyping.`);
    isMock = true;
  }
}

// Helper query function
async function query(sql, params = []) {
  if (!isMock && pool) {
    const [results] = await pool.execute(sql, params);
    return results;
  }

  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  if (upper.startsWith('SELECT')) {
    if (upper.includes('FROM PLATFORMS') || upper.includes('FROM `PLATFORMS`')) {
      return mockData.platforms;
    }
    if (upper.includes('FROM CLIENTS') || upper.includes('FROM `CLIENTS`')) {
      return mockData.clients;
    }
    if (upper.includes('FROM DOMAINS') || upper.includes('FROM `DOMAINS`')) {
      return mockData.domains;
    }
    if (upper.includes('FROM HOSTINGS') || upper.includes('FROM `HOSTINGS`')) {
      return mockData.hostings;
    }
    if (upper.includes('FROM NOTIFICATION_LOGS') || upper.includes('FROM `NOTIFICATION_LOGS`')) {
      return mockData.notifications;
    }
    if (upper.includes('FROM APP_SETTINGS') || upper.includes('FROM `APP_SETTINGS`')) {
      return Object.entries(mockData.settings).map(([k, v]) => ({ setting_key: k, setting_value: v }));
    }
    return [];
  }

  return { insertId: Date.now(), affectedRows: 1 };
}

async function getAppSetting(key, defaultValue = null) {
  if (isMock || !pool) {
    return mockData.settings[key] !== undefined ? mockData.settings[key] : defaultValue;
  }
  try {
    const [rows] = await pool.execute(`SELECT setting_value FROM app_settings WHERE setting_key = ?`, [key]);
    if (rows && rows.length > 0 && rows[0].setting_value !== null && rows[0].setting_value !== undefined) {
      return rows[0].setting_value;
    }
  } catch (e) {
    console.warn(`Error getting setting ${key}:`, e.message);
  }
  return mockData.settings[key] !== undefined ? mockData.settings[key] : defaultValue;
}

async function setAppSetting(key, value) {
  mockData.settings[key] = String(value);
  if (!isMock && pool) {
    try {
      await pool.execute(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, String(value)]
      );
    } catch (e) {
      console.warn(`Error setting app_setting ${key}:`, e.message);
    }
  }
  return true;
}

module.exports = {
  initDB,
  query,
  getPool: () => pool,
  isMockMode: () => isMock,
  mockData,
  getAppSetting,
  setAppSetting
};
