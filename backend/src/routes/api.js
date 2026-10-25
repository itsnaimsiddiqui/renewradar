const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const dashboardController = require('../controllers/dashboardController');
const domainController = require('../controllers/domainController');
const hostingController = require('../controllers/hostingController');
const clientController = require('../controllers/clientController');
const telegramController = require('../controllers/telegramController');
const platformController = require('../controllers/platformController');
const bundleController = require('../controllers/bundleController');

// 1. Public Authentication Route
router.post('/auth/login', authController.login);

// Protected Routes (Require Bearer Token)
router.use(authMiddleware);

// Auth session check
router.get('/auth/me', authController.getMe);

// Dashboard
router.get('/dashboard/summary', dashboardController.getSummary);

// Domains
router.get('/domains', domainController.getAllDomains);
router.get('/domains/:id', domainController.getDomainById);
router.post('/domains', domainController.createDomain);
router.put('/domains/:id', domainController.updateDomain);
router.post('/domains/:id/renew', domainController.renewDomain);
router.delete('/domains/:id', domainController.deleteDomain);

// Hostings
router.get('/hostings', hostingController.getAllHostings);
router.get('/hostings/:id', hostingController.getHostingById);
router.post('/hostings', hostingController.createHosting);
router.put('/hostings/:id', hostingController.updateHosting);
router.post('/hostings/:id/renew', hostingController.renewHosting);
router.delete('/hostings/:id', hostingController.deleteHosting);

// Clients
router.get('/clients', clientController.getAllClients);
router.get('/clients/:id', clientController.getClientById);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);

// Platforms / Providers
router.get('/platforms', platformController.getAllPlatforms);
router.post('/platforms', platformController.createPlatform);
router.put('/platforms/:id', platformController.updatePlatform);
router.delete('/platforms/:id', platformController.deletePlatform);

// Combo Bundles
router.post('/bundles', bundleController.createBundle);
router.post('/bundles/renew', bundleController.renewBundle);

// Telegram & Reminders
router.get('/telegram/status', telegramController.getBotStatus);
router.get('/telegram/settings', telegramController.getSettings);
router.post('/telegram/settings', telegramController.updateSettings);
router.post('/telegram/test', telegramController.sendTestMessage);
router.post('/telegram/trigger-check', telegramController.triggerExpiryCheck);
router.get('/telegram/logs', telegramController.getNotificationLogs);

module.exports = router;
