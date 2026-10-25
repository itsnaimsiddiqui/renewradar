const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');

// Create a combined Domain + Hosting Package bought together
exports.createBundle = async (req, res) => {
  try {
    const {
      client_id,
      domain_name,
      package_name,
      platform = 'Namecheap Account 1',
      registration_date,
      expiry_date,
      server_name = 's12018',
      ip_address = '209.42.27.76',
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

    const cleanDomain = domain_name.trim().toLowerCase();
    const cleanPackage = package_name.trim();
    const daysLeft = getDaysRemaining(expiry_date);
    const status = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring_soon' : 'active';

    if (isMockMode()) {
      const client = mockData.clients.find(c => String(c.id) === String(client_id));
      const hostingId = Date.now();
      const domainId = hostingId + 1;

      const newHosting = {
        id: hostingId,
        client_id: client_id ? Number(client_id) : null,
        linked_domain_id: domainId,
        is_bundle: 1,
        client_name: client ? client.name : null,
        client_phone: client ? client.phone : null,
        client_company: client ? client.company : null,
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
        client_id: client_id ? Number(client_id) : null,
        linked_hosting_id: hostingId,
        is_bundle: 1,
        client_name: client ? client.name : null,
        client_phone: client ? client.phone : null,
        client_company: client ? client.company : null,
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
        INSERT INTO hostings (client_id, is_bundle, package_name, provider, server_name, ip_address, primary_domain, start_date, expiry_date, billing_cycle, cost_price, client_price, status, notes)
        VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
        INSERT INTO domains (client_id, linked_hosting_id, is_bundle, domain_name, registrar, account_label, registration_date, expiry_date, auto_renew, cost_price, client_price, status, notes)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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

      // Update linked_domain_id on hosting
      await conn.execute(`UPDATE hostings SET linked_domain_id = ? WHERE id = ?`, [domainId, hostingId]);

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
    const { domainId, hostingId, years = 1 } = req.body;
    const months = years * 12;

    if (isMockMode()) {
      let d = null;
      let h = null;

      if (domainId) {
        d = mockData.domains.find(item => String(item.id) === String(domainId));
        if (d && d.linked_hosting_id) {
          h = mockData.hostings.find(item => String(item.id) === String(d.linked_hosting_id));
        }
      }

      if (!h && hostingId) {
        h = mockData.hostings.find(item => String(item.id) === String(hostingId));
        if (h && h.linked_domain_id) {
          d = mockData.domains.find(item => String(item.id) === String(h.linked_domain_id));
        }
      }

      if (d) {
        const curD = new Date(d.expiry_date);
        const baseD = curD < new Date() ? new Date() : curD;
        baseD.setFullYear(baseD.getFullYear() + years);
        d.expiry_date = baseD.toISOString().split('T')[0];
        d.status = 'active';
        d.last_notified_tier = null;
        d.days_remaining = getDaysRemaining(d.expiry_date);
      }

      if (h) {
        const curH = new Date(h.expiry_date);
        const baseH = curH < new Date() ? new Date() : curH;
        baseH.setMonth(baseH.getMonth() + months);
        h.expiry_date = baseH.toISOString().split('T')[0];
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
        const [rows] = await conn.execute(`SELECT linked_hosting_id FROM domains WHERE id = ?`, [domainId]);
        if (rows.length && rows[0].linked_hosting_id) {
          targetHostingId = rows[0].linked_hosting_id;
        }
      }

      if (hostingId && !domainId) {
        const [rows] = await conn.execute(`SELECT linked_domain_id FROM hostings WHERE id = ?`, [hostingId]);
        if (rows.length && rows[0].linked_domain_id) {
          targetDomainId = rows[0].linked_domain_id;
        }
      }

      if (targetDomainId) {
        const [dRows] = await conn.execute(`SELECT expiry_date FROM domains WHERE id = ?`, [targetDomainId]);
        if (dRows.length) {
          const curD = new Date(dRows[0].expiry_date);
          const baseD = curD < new Date() ? new Date() : curD;
          baseD.setFullYear(baseD.getFullYear() + years);
          await conn.execute(
            `UPDATE domains SET expiry_date = ?, status = 'active', last_notified_tier = NULL WHERE id = ?`,
            [baseD.toISOString().split('T')[0], targetDomainId]
          );
        }
      }

      if (targetHostingId) {
        const [hRows] = await conn.execute(`SELECT expiry_date FROM hostings WHERE id = ?`, [targetHostingId]);
        if (hRows.length) {
          const curH = new Date(hRows[0].expiry_date);
          const baseH = curH < new Date() ? new Date() : curH;
          baseH.setMonth(baseH.getMonth() + months);
          await conn.execute(
            `UPDATE hostings SET expiry_date = ?, status = 'active', last_notified_tier = NULL WHERE id = ?`,
            [baseH.toISOString().split('T')[0], targetHostingId]
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
