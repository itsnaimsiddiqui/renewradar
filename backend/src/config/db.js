const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let pool = null;
let isMock = false;

// Dynamic Platforms dataset
let mockData = {
  platforms: [
    {
      id: 1,
      name: 'Namecheap Account 1',
      type: 'both',
      website: 'https://namecheap.com',
      account_identifier: 'account1@agency.com',
      notes: 'Primary Namecheap account for client domains & hosting'
    },
    {
      id: 2,
      name: 'Namecheap Account 2',
      type: 'both',
      website: 'https://namecheap.com',
      account_identifier: 'account2@agency.com',
      notes: 'Secondary Namecheap account for e-commerce portals'
    },
    {
      id: 3,
      name: 'Hostinger',
      type: 'both',
      website: 'https://hostinger.com',
      account_identifier: 'admin@hostinger.com',
      notes: 'Hostinger cloud & cPanel shared hosting'
    },
    {
      id: 4,
      name: 'HostGator',
      type: 'both',
      website: 'https://hostgator.com',
      account_identifier: '',
      notes: 'HostGator baby/business packages'
    },
    {
      id: 5,
      name: 'GoDaddy',
      type: 'registrar',
      website: 'https://godaddy.com',
      account_identifier: '',
      notes: 'Domain registrar account'
    }
  ],
  clients: [
    { id: 1, name: 'Tanvir Ahmed', company: 'Skyline Agency', phone: '+8801711223344', email: 'tanvir@skyline.com', notes: 'Domain & Hosting Combo client', created_at: new Date(), updated_at: new Date() },
    { id: 2, name: 'Sarah Rahman', company: 'Apex Fashion Ltd', phone: '+8801819876543', email: 'sarah@apexfashion.com', notes: 'Always renews early', created_at: new Date(), updated_at: new Date() },
    { id: 3, name: 'Kamrul Hasan', company: 'FinTech Soft', phone: '+8801912345678', email: 'kamrul@fintechsoft.net', notes: 'Needs reminder 15 days ahead', created_at: new Date(), updated_at: new Date() },
    { id: 4, name: 'Rashidul Islam', company: 'Dhaka Cart Ecom', phone: '+8801678901234', email: 'info@dhakacart.com', notes: 'Call directly on mobile', created_at: new Date(), updated_at: new Date() }
  ],
  domains: [
    {
      id: 1,
      client_id: 1,
      linked_hosting_id: 1,
      is_bundle: 1,
      client_name: 'Tanvir Ahmed',
      client_phone: '+8801711223344',
      client_company: 'Skyline Agency',
      domain_name: 'skylineagency.com',
      registrar: 'Namecheap',
      account_label: 'Namecheap Account 1',
      registration_date: '2025-11-01',
      expiry_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      auto_renew: 0,
      cost_price: 13.99,
      client_price: 25.00,
      status: 'expiring_soon',
      notes: 'Combo bundle with 20GB Pro Hosting',
      last_notified_tier: null
    },
    {
      id: 2,
      client_id: 2,
      linked_hosting_id: null,
      is_bundle: 0,
      client_name: 'Sarah Rahman',
      client_phone: '+8801819876543',
      client_company: 'Apex Fashion Ltd',
      domain_name: 'apexfashionbd.com',
      registrar: 'Namecheap',
      account_label: 'Namecheap Account 2',
      registration_date: '2025-05-15',
      expiry_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      auto_renew: 0,
      cost_price: 14.50,
      client_price: 28.00,
      status: 'expiring_soon',
      notes: 'Client requested invoice for renewal',
      last_notified_tier: null
    },
    {
      id: 3,
      client_id: 3,
      linked_hosting_id: null,
      is_bundle: 0,
      client_name: 'Kamrul Hasan',
      client_phone: '+8801912345678',
      client_company: 'FinTech Soft',
      domain_name: 'fintechsoft.net',
      registrar: 'Hostinger',
      account_label: 'Hostinger',
      registration_date: '2025-10-20',
      expiry_date: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      auto_renew: 0,
      cost_price: 16.00,
      client_price: 30.00,
      status: 'active',
      notes: 'Hostinger registrar',
      last_notified_tier: null
    },
    {
      id: 4,
      client_id: 4,
      linked_hosting_id: 3,
      is_bundle: 1,
      client_name: 'Rashidul Islam',
      client_phone: '+8801678901234',
      client_company: 'Dhaka Cart Ecom',
      domain_name: 'dhakacart.com',
      registrar: 'Namecheap',
      account_label: 'Namecheap Account 2',
      registration_date: '2024-10-10',
      expiry_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      auto_renew: 0,
      cost_price: 13.99,
      client_price: 25.00,
      status: 'expired',
      notes: 'Expired 2 days ago! Combo bundle with 5GB cPanel',
      last_notified_tier: 0
    },
    {
      id: 5,
      client_id: 1,
      linked_hosting_id: null,
      is_bundle: 0,
      client_name: 'Tanvir Ahmed',
      client_phone: '+8801711223344',
      client_company: 'Skyline Agency',
      domain_name: 'skyline-portfolio.org',
      registrar: 'Namecheap',
      account_label: 'Namecheap Account 1',
      registration_date: '2026-01-10',
      expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      auto_renew: 1,
      cost_price: 12.00,
      client_price: 22.00,
      status: 'active',
      notes: 'Auto-renew enabled',
      last_notified_tier: null
    }
  ],
  hostings: [
    {
      id: 1,
      client_id: 1,
      linked_domain_id: 1,
      is_bundle: 1,
      client_name: 'Tanvir Ahmed',
      client_phone: '+8801711223344',
      client_company: 'Skyline Agency',
      package_name: '20GB Pro cPanel Package',
      provider: 'Namecheap Account 1',
      server_name: 's12018',
      ip_address: '209.42.27.76',
      primary_domain: 'skylineagency.com',
      start_date: '2025-11-01',
      expiry_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      billing_cycle: 'annual',
      cost_price: 45.00,
      client_price: 90.00,
      status: 'expiring_soon',
      notes: 'Combo bundle with skylineagency.com',
      last_notified_tier: null
    },
    {
      id: 2,
      client_id: 2,
      linked_domain_id: null,
      is_bundle: 0,
      client_name: 'Sarah Rahman',
      client_phone: '+8801819876543',
      client_company: 'Apex Fashion Ltd',
      package_name: '10GB Business cPanel',
      provider: 'Hostinger',
      server_name: 's12018',
      ip_address: '209.42.27.76',
      primary_domain: 'apexfashionbd.com',
      start_date: '2025-05-15',
      expiry_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      billing_cycle: 'annual',
      cost_price: 30.00,
      client_price: 65.00,
      status: 'expiring_soon',
      notes: 'Hostinger cloud cPanel',
      last_notified_tier: null
    },
    {
      id: 3,
      client_id: 4,
      linked_domain_id: 4,
      is_bundle: 1,
      client_name: 'Rashidul Islam',
      client_phone: '+8801678901234',
      client_company: 'Dhaka Cart Ecom',
      package_name: '5GB Starter cPanel',
      provider: 'Namecheap Account 2',
      server_name: 's12018',
      ip_address: '209.42.27.76',
      primary_domain: 'dhakacart.com',
      start_date: '2024-10-10',
      expiry_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      billing_cycle: 'annual',
      cost_price: 20.00,
      client_price: 45.00,
      status: 'expired',
      notes: 'Combo bundle with dhakacart.com',
      last_notified_tier: 0
    }
  ],
  notifications: [
    {
      id: 1,
      type: 'bundle',
      reference_id: 1,
      item_title: 'skylineagency.com (Combo: Domain + Hosting)',
      days_remaining: 5,
      message: '🚨 Bundle skylineagency.com (Domain + 20GB Hosting) expires in 5 days! Client: Tanvir Ahmed (+8801711223344)',
      status: 'sent',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  settings: {
    alert_days: '30,15,7,3,1,0',
    cron_time: '09:00',
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
    telegram_chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CEO_CHAT_ID || ''
  }
};

async function initDB() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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

