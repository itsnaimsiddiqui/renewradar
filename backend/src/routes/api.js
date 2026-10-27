const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const dashboardController = require('../controllers/dashboardController');
const domainController = require('../controllers/domainController');
const hostingController = require('../controllers/hostingController');
const clientController = require('../controllers/clientController');
const telegramController = require('../controllers/telegramController');
const platformController = require('../controllers/platformController');
const bundleController = require('../controllers/bundleController');

// 1. Public Authentication Route & Health Check
router.post('/auth/login', authController.login);
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'RenewRadar API',
    version: '1.0.0'
  });
});

// Protected Routes (Require Bearer Token for every write/read)
router.use(authMiddleware);

// Auth session check
router.get('/auth/me', authController.getMe);

// Dashboard
router.get('/dashboard/summary', dashboardController.getSummary);

// Domains (Authenticated & user_id scoped)
router.get('/domains', domainController.getAllDomains);
router.get('/domains/:id', domainController.getDomainById);
router.post('/domains', domainController.createDomain);
router.put('/domains/:id', domainController.updateDomain);
router.post('/domains/:id/renew', domainController.renewDomain);
router.delete('/domains/:id', domainController.deleteDomain);

// Hostings (Authenticated & user_id scoped)
router.get('/hostings', hostingController.getAllHostings);
router.get('/hostings/:id', hostingController.getHostingById);
router.post('/hostings', hostingController.createHosting);
router.put('/hostings/:id', hostingController.updateHosting);
router.post('/hostings/:id/renew', hostingController.renewHosting);
router.delete('/hostings/:id', hostingController.deleteHosting);

// Clients (Authenticated & user_id scoped)
router.get('/clients', clientController.getAllClients);
router.get('/clients/:id', clientController.getClientById);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);

// Platforms / Providers (Admin role check on modifications)
router.get('/platforms', platformController.getAllPlatforms);
router.post('/platforms', requireAdmin, platformController.createPlatform);
router.put('/platforms/:id', requireAdmin, platformController.updatePlatform);
router.delete('/platforms/:id', requireAdmin, platformController.deletePlatform);

// Combo Bundles (Authenticated & user_id scoped)
router.post('/bundles', bundleController.createBundle);
router.post('/bundles/renew', bundleController.renewBundle);

// Telegram & Alert Settings (Admin role protected)
router.get('/telegram/status', requireAdmin, telegramController.getBotStatus);
router.get('/telegram/settings', requireAdmin, telegramController.getSettings);
router.post('/telegram/settings', requireAdmin, telegramController.updateSettings);
router.post('/telegram/test', requireAdmin, telegramController.sendTestMessage);
router.post('/telegram/trigger-check', requireAdmin, telegramController.triggerExpiryCheck);
router.get('/telegram/logs', requireAdmin, telegramController.getNotificationLogs);

module.exports = router;
