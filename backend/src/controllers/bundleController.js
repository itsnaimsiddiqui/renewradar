const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');
const { calculateStatus, addYearsToDate, addMonthsToDate } = require('../utils/statusHelper');

// Create a combined Domain + Hosting Package bought together
exports.createBundle = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user authentication' });
    }
    const userId = req.user.id || req.user.user_id;

    const {
      client_id,
      domain_name,
      package_name,
      platform = 'Namecheap Account 1',
      registration_date,
      expiry_date,
      server_name = 'Cloud Server 1',
      ip_address = '192.0.2.1',
      domain_cost = 13.99,
      domain_price = 25.00,
      hosting_cost = 45.00,
      hosting_price = 90.00,
      billing_cycle = 'annual',
      auto_renew = 0,
      notes = ''
    } = req.body;

    if (!domain_name || !package_name || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'Domain name, hosting package name, and expiry date are required'
      });
    }

    // Security Check: Verify that the referenced client_id belongs to the caller before linking
    let clientRecord = null;
    if (client_id) {
      if (isMockMode()) {
        clientRecord = mockData.clients.find(c => String(c.id) === String(client_id) && c.user_id === userId);
        if (!clientRecord) {
          return res.status(404).json({ success: false, message: 'Client not found or access denied' });
        }
      } else {
        const clientRows = await query(`SELECT id, name, phone, company FROM clients WHERE id = ? AND user_id = ?`, [client_id, userId]);
        if (!clientRows.length) {
          return res.status(404).json({ success: false, message: 'Client not found or access denied' });
        }
        clientRecord = clientRows[0];
      }
    }

    const cleanDomain = domain_name.trim().toLowerCase();
    const cleanPackage = package_name.trim();
    const daysLeft = getDaysRemaining(expiry_date);
    const status = calculateStatus(daysLeft, 'active');

    if (isMockMode()) {
      const hostingId = Date.now();
      const domainId = hostingId + 1;

      const newHosting = {
        id: hostingId,
        user_id: userId,
        client_id: client_id ? Number(client_id) : null,
        linked_domain_id: domainId,
        is_bundle: 1,
        client_name: clientRecord ? clientRecord.name : null,
        client_phone: clientRecord ? clientRecord.phone : null,
        client_company: clientRecord ? clientRecord.company : null,
        package_name: cleanPackage,
        provider: platform,
        server_name,
        ip_address,
        primary_domain: cleanDomain,
        start_date: registration_date || null,
        expiry_date,
        billing_cycle,
        cost_price: Number(hosting_cost) || 0,
        client_price: Number(hosting_price) || 0,
        status,
        notes: `Combo Bundle with ${cleanDomain}. ${notes}`.trim(),
        last_notified_tier: null,
        days_remaining: daysLeft,
        created_at: new Date(),
        updated_at: new Date()
      };

      const newDomain = {
        id: domainId,
        user_id: userId,
        client_id: client_id ? Number(client_id) : null,
        linked_hosting_id: hostingId,
        is_bundle: 1,
        client_name: clientRecord ? clientRecord.name : null,
        client_phone: clientRecord ? clientRecord.phone : null,
        client_company: clientRecord ? clientRecord.company : null,
        domain_name: cleanDomain,
        registrar: platform,
        account_label: platform,
        registration_date: registration_date || null,
        expiry_date,
        auto_renew: Boolean(auto_renew) ? 1 : 0,
        cost_price: Number(domain_cost) || 0,
        client_price: Number(domain_price) || 0,
        status,
        notes: `Combo Bundle with ${cleanPackage}. ${notes}`.trim(),
        last_notified_tier: null,
        days_remaining: daysLeft,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockData.hostings.unshift(newHosting);
      mockData.domains.unshift(newDomain);

      return res.status(201).json({
        success: true,
        message: 'Combo Bundle (Domain + Hosting) created successfully!',
        data: { domain: newDomain, hosting: newHosting }
      });
    }

    // Live MariaDB Transaction
    const conn = await (require('../config/db').getPool()).getConnection();
    try {
      await conn.beginTransaction();

      const [hostRes] = await conn.execute(`
        INSERT INTO hostings (user_id, client_id, is_bundle, package_name, provider, server_name, ip_address, primary_domain, start_date, expiry_date, billing_cycle, cost_price, client_price, status, notes)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        client_id || null,
        cleanPackage,
        platform,
        server_name,
        ip_address,
        cleanDomain,
        registration_date || null,
        expiry_date,
        billing_cycle,
        hosting_cost,
        hosting_price,
        status,
        `Combo Bundle with ${cleanDomain}. ${notes}`.trim()
      ]);

      const hostingId = hostRes.insertId;

      const [domRes] = await conn.execute(`
        INSERT INTO domains (user_id, client_id, linked_hosting_id, is_bundle, domain_name, registrar, account_label, registration_date, expiry_date, auto_renew, cost_price, client_price, status, notes)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        client_id || null,
        hostingId,
        cleanDomain,
        platform,
        platform,
        registration_date || null,
        expiry_date,
        auto_renew ? 1 : 0,
        domain_cost,
        domain_price,
        status,
        `Combo Bundle with ${cleanPackage}. ${notes}`.trim()
      ]);

      const domainId = domRes.insertId;

      // Update linked_domain_id on hosting scoped by user_id
      await conn.execute(`UPDATE hostings SET linked_domain_id = ? WHERE id = ? AND user_id = ?`, [domainId, hostingId, userId]);

      await conn.commit();
      res.status(201).json({
        success: true,
        message: 'Combo Bundle created successfully',
        data: { domainId, hostingId }
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 1-Click Renew Bundle (Extends both domain and linked hosting together)
exports.renewBundle = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user authentication' });
    }
    const userId = req.user.id || req.user.user_id;
    const { domainId, hostingId, years = 1 } = req.body;
    const months = years * 12;

    // Security Check: Pre-verify that provided domain and hosting belong to the caller
    if (domainId) {
      if (isMockMode()) {
        const d = mockData.domains.find(item => String(item.id) === String(domainId) && item.user_id === userId);
        if (!d) return res.status(404).json({ success: false, message: 'Domain not found or access denied' });
      } else {
        const dRows = await query(`SELECT id FROM domains WHERE id = ? AND user_id = ?`, [domainId, userId]);
        if (!dRows.length) return res.status(404).json({ success: false, message: 'Domain not found or access denied' });
      }
    }

    if (hostingId) {
      if (isMockMode()) {
        const h = mockData.hostings.find(item => String(item.id) === String(hostingId) && item.user_id === userId);
        if (!h) return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });
      } else {
        const hRows = await query(`SELECT id FROM hostings WHERE id = ? AND user_id = ?`, [hostingId, userId]);
        if (!hRows.length) return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });
      }
    }

    if (isMockMode()) {
      let d = null;
      let h = null;

      if (domainId) {
        d = mockData.domains.find(item => String(item.id) === String(domainId) && item.user_id === userId);
        if (d && d.linked_hosting_id) {
          h = mockData.hostings.find(item => String(item.id) === String(d.linked_hosting_id) && item.user_id === userId);
        }
      }

      if (!h && hostingId) {
        h = mockData.hostings.find(item => String(item.id) === String(hostingId) && item.user_id === userId);
        if (h && h.linked_domain_id) {
          d = mockData.domains.find(item => String(item.id) === String(h.linked_domain_id) && item.user_id === userId);
        }
      }

      if (d) {
        d.expiry_date = addYearsToDate(d.expiry_date, years);
        d.status = 'active';
        d.last_notified_tier = null;
        d.days_remaining = getDaysRemaining(d.expiry_date);
      }

      if (h) {
        h.expiry_date = addMonthsToDate(h.expiry_date, months);
        h.status = 'active';
        h.last_notified_tier = null;
        h.days_remaining = getDaysRemaining(h.expiry_date);
      }

      return res.json({
        success: true,
        message: `Combo Bundle successfully renewed for +${years} year(s)!`
      });
    }

    // MariaDB
    const conn = await (require('../config/db').getPool()).getConnection();
    try {
      await conn.beginTransaction();

      let targetDomainId = domainId;
      let targetHostingId = hostingId;

      if (domainId && !hostingId) {
        const [rows] = await conn.execute(`SELECT linked_hosting_id FROM domains WHERE id = ? AND user_id = ?`, [domainId, userId]);
        if (rows.length && rows[0].linked_hosting_id) {
          targetHostingId = rows[0].linked_hosting_id;
        }
      }

      if (hostingId && !domainId) {
        const [rows] = await conn.execute(`SELECT linked_domain_id FROM hostings WHERE id = ? AND user_id = ?`, [hostingId, userId]);
        if (rows.length && rows[0].linked_domain_id) {
          targetDomainId = rows[0].linked_domain_id;
        }
      }

      if (targetDomainId) {
        const [dRows] = await conn.execute(`SELECT expiry_date FROM domains WHERE id = ? AND user_id = ?`, [targetDomainId, userId]);
        if (dRows.length) {
          const newExp = addYearsToDate(dRows[0].expiry_date, years);
          await conn.execute(
            `UPDATE domains SET expiry_date = ?, status = 'active', last_notified_tier = NULL WHERE id = ? AND user_id = ?`,
            [newExp, targetDomainId, userId]
          );
        }
      }

      if (targetHostingId) {
        const [hRows] = await conn.execute(`SELECT expiry_date FROM hostings WHERE id = ? AND user_id = ?`, [targetHostingId, userId]);
        if (hRows.length) {
          const newExp = addMonthsToDate(hRows[0].expiry_date, months);
          await conn.execute(
            `UPDATE hostings SET expiry_date = ?, status = 'active', last_notified_tier = NULL WHERE id = ? AND user_id = ?`,
            [newExp, targetHostingId, userId]
          );
        }
      }

      await conn.commit();
      res.json({ success: true, message: `Combo Bundle renewed for +${years} year(s)!` });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
