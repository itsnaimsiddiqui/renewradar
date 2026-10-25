const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');

exports.getSummary = async (req, res) => {
  try {
    let domains = [];
    let hostings = [];
    let clients = [];
    let platforms = [];
    let recentNotifications = [];

    if (isMockMode()) {
      domains = [...mockData.domains];
      hostings = [...mockData.hostings];
      clients = [...mockData.clients];
      platforms = [...mockData.platforms];
      recentNotifications = [...mockData.notifications].slice(0, 10);
    } else {
      domains = await query(`
        SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM domains d
        LEFT JOIN clients c ON d.client_id = c.id
      `);

      hostings = await query(`
        SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM hostings h
        LEFT JOIN clients c ON h.client_id = c.id
      `);

      clients = await query(`SELECT * FROM clients`);
      platforms = await query(`SELECT * FROM platforms`);
      recentNotifications = await query(`SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10`);
    }

    // Calculations
    let expiredDomains = 0;
    let expiringDomains7 = 0;
    let expiringDomains15 = 0;
    let expiringDomains30 = 0;

    // Dynamic Platform Aggregation
    let assetsByPlatform = {};
    platforms.forEach(p => {
      assetsByPlatform[p.name] = { domains: 0, hostings: 0, total: 0 };
    });

    let totalClientRevenue = 0;
    let totalCostPrice = 0;

    domains.forEach(d => {
      const days = getDaysRemaining(d.expiry_date);
      d.days_remaining = days;

      if (days < 0) expiredDomains++;
      else if (days <= 7) expiringDomains7++;
      else if (days <= 15) expiringDomains15++;
      else if (days <= 30) expiringDomains30++;

      const acc = d.account_label || d.registrar || 'Other Platform';
      if (!assetsByPlatform[acc]) {
        assetsByPlatform[acc] = { domains: 0, hostings: 0, total: 0 };
      }
      assetsByPlatform[acc].domains++;
      assetsByPlatform[acc].total++;

      totalClientRevenue += parseFloat(d.client_price || 0);
      totalCostPrice += parseFloat(d.cost_price || 0);
    });

    let expiredHostings = 0;
    let expiringHostings7 = 0;
    let expiringHostings15 = 0;
    let expiringHostings30 = 0;

    hostings.forEach(h => {
      const days = getDaysRemaining(h.expiry_date);
      h.days_remaining = days;

      if (days < 0) expiredHostings++;
      else if (days <= 7) expiringHostings7++;
      else if (days <= 15) expiringHostings15++;
      else if (days <= 30) expiringHostings30++;

      const prov = h.provider || 'Other Platform';
      if (!assetsByPlatform[prov]) {
        assetsByPlatform[prov] = { domains: 0, hostings: 0, total: 0 };
      }
      assetsByPlatform[prov].hostings++;
      assetsByPlatform[prov].total++;

      totalClientRevenue += parseFloat(h.client_price || 0);
      totalCostPrice += parseFloat(h.cost_price || 0);
    });

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
          account: h.provider || `Server: ${h.server_name || 's12018'}`,
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
          expired_total: expiredDomains + expiredHostings,
          expired_domains: expiredDomains,
          expired_hostings: expiredHostings,
          expiring_7_days: expiringDomains7 + expiringHostings7,
          expiring_15_days: expiringDomains15 + expiringHostings15,
          expiring_30_days: expiringDomains30 + expiringHostings30
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
