const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');
const { countByExpiryWindow } = require('../utils/statusHelper');

exports.getSummary = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user authentication' });
    }
    const userId = req.user.id || req.user.user_id;

    let domains = [];
    let hostings = [];
    let clients = [];
    let platforms = [];
    let recentNotifications = [];

    if (isMockMode()) {
      domains = mockData.domains.filter(d => d.user_id === userId);
      hostings = mockData.hostings.filter(h => h.user_id === userId);
      clients = mockData.clients.filter(c => c.user_id === userId);
      platforms = mockData.platforms.filter(p => p.user_id === userId);
      recentNotifications = mockData.notifications.filter(n => n.user_id === userId).slice(0, 10);
    } else {
      domains = await query(`
        SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM domains d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.user_id = ?
      `, [userId]);

      hostings = await query(`
        SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM hostings h
        LEFT JOIN clients c ON h.client_id = c.id
        WHERE h.user_id = ?
      `, [userId]);

      clients = await query(`SELECT * FROM clients WHERE user_id = ?`, [userId]);
      platforms = await query(`SELECT * FROM platforms WHERE user_id = ?`, [userId]);
      recentNotifications = await query(`SELECT * FROM notification_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, [userId]);
    }

    // Attach days remaining & calculate financial totals and platform distributions
    let totalClientRevenue = 0;
    let totalCostPrice = 0;
    let assetsByPlatform = {};

    platforms.forEach(p => {
      assetsByPlatform[p.name] = { domains: 0, hostings: 0, total: 0 };
    });

    domains.forEach(d => {
      d.days_remaining = getDaysRemaining(d.expiry_date);
      const acc = d.account_label || d.registrar || 'Other Platform';
      if (!assetsByPlatform[acc]) {
        assetsByPlatform[acc] = { domains: 0, hostings: 0, total: 0 };
      }
      assetsByPlatform[acc].domains++;
      assetsByPlatform[acc].total++;

      totalClientRevenue += parseFloat(d.client_price || 0);
      totalCostPrice += parseFloat(d.cost_price || 0);
    });

    hostings.forEach(h => {
      h.days_remaining = getDaysRemaining(h.expiry_date);
      const prov = h.provider || 'Other Platform';
      if (!assetsByPlatform[prov]) {
        assetsByPlatform[prov] = { domains: 0, hostings: 0, total: 0 };
      }
      assetsByPlatform[prov].hostings++;
      assetsByPlatform[prov].total++;

      totalClientRevenue += parseFloat(h.client_price || 0);
      totalCostPrice += parseFloat(h.cost_price || 0);
    });

    // Reusable aggregation for domains and hostings
    const domWindow = countByExpiryWindow(domains);
    const hostWindow = countByExpiryWindow(hostings);

    // Urgent call list: deduplicate bundles so the admin calls the client once for both
    const processedBundleDomainIds = new Set();
    const urgentCalls = [];

    // First, add bundles (where domain + hosting are linked)
    domains.forEach(d => {
      if (d.days_remaining <= 7 && d.linked_hosting_id) {
        const linkedH = hostings.find(h => String(h.id) === String(d.linked_hosting_id));
        processedBundleDomainIds.add(d.id);

        urgentCalls.push({
          id: d.id,
          hosting_id: linkedH ? linkedH.id : null,
          type: 'bundle',
          title: `${d.domain_name} + ${linkedH ? linkedH.package_name : 'Hosting'}`,
          account: d.account_label || d.registrar,
          days_remaining: d.days_remaining,
          expiry_date: d.expiry_date,
          client_id: d.client_id,
          client_name: d.client_name || 'Unassigned',
          client_phone: d.client_phone || '',
          renewal_price: (parseFloat(d.client_price || 0) + parseFloat(linkedH ? linkedH.client_price || 0 : 0)).toFixed(2),
          is_bundle: true
        });
      }
    });

    // Add remaining standalone domains
    domains.forEach(d => {
      if (d.days_remaining <= 7 && !processedBundleDomainIds.has(d.id)) {
        urgentCalls.push({
          id: d.id,
          type: 'domain',
          title: d.domain_name,
          account: d.account_label || d.registrar,
          days_remaining: d.days_remaining,
          expiry_date: d.expiry_date,
          client_id: d.client_id,
          client_name: d.client_name || 'Unassigned',
          client_phone: d.client_phone || '',
          renewal_price: d.client_price,
          is_bundle: false
        });
      }
    });

    // Add remaining standalone hostings (not already part of a processed bundle)
    hostings.forEach(h => {
      const isAlreadyInBundle = h.linked_domain_id && processedBundleDomainIds.has(h.linked_domain_id);
      if (h.days_remaining <= 7 && !isAlreadyInBundle) {
        urgentCalls.push({
          id: h.id,
          type: 'hosting',
          title: `${h.package_name}${h.primary_domain ? ` (${h.primary_domain})` : ''}`,
          account: h.provider || `Server: ${h.server_name || 'Cloud Server 1'}`,
          days_remaining: h.days_remaining,
          expiry_date: h.expiry_date,
          client_id: h.client_id,
          client_name: h.client_name || 'Unassigned',
          client_phone: h.client_phone || '',
          renewal_price: h.client_price,
          is_bundle: false
        });
      }
    });

    urgentCalls.sort((a, b) => a.days_remaining - b.days_remaining);

    res.json({
      success: true,
      data: {
        counts: {
          total_domains: domains.length,
          total_hostings: hostings.length,
          total_clients: clients.length,
          total_platforms: platforms.length,
          expired_total: domWindow.expired + hostWindow.expired,
          expired_domains: domWindow.expired,
          expired_hostings: hostWindow.expired,
          expiring_7_days: domWindow.expiring7 + hostWindow.expiring7,
          expiring_15_days: domWindow.expiring15 + hostWindow.expiring15,
          expiring_30_days: domWindow.expiring30 + hostWindow.expiring30
        },
        financials: {
          total_client_revenue: totalClientRevenue.toFixed(2),
          total_cost_price: totalCostPrice.toFixed(2),
          net_profit: (totalClientRevenue - totalCostPrice).toFixed(2)
        },
        assets_by_platform: assetsByPlatform,
        urgent_calls: urgentCalls,
        recent_notifications: recentNotifications,
        is_mock_mode: isMockMode()
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
