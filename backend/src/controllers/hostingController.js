const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');
const { calculateStatus, addMonthsToDate } = require('../utils/statusHelper');

exports.getAllHostings = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user authentication' });
    }
    const userId = req.user.id || req.user.user_id;
    const { search, server, provider, status, clientId } = req.query;

    let hostings = [];
    let domains = [];

    if (isMockMode()) {
      hostings = mockData.hostings.filter(h => h.user_id === userId);
      domains = mockData.domains.filter(d => d.user_id === userId);

      if (search) {
        const q = search.toLowerCase();
        hostings = hostings.filter(h =>
          h.package_name.toLowerCase().includes(q) ||
          (h.primary_domain && h.primary_domain.toLowerCase().includes(q)) ||
          (h.client_name && h.client_name.toLowerCase().includes(q)) ||
          (h.provider && h.provider.toLowerCase().includes(q)) ||
          (h.server_name && h.server_name.toLowerCase().includes(q))
        );
      }
      if (server && server !== 'all') {
        hostings = hostings.filter(h => h.server_name === server);
      }
      if (provider && provider !== 'all') {
        hostings = hostings.filter(h => h.provider === provider);
      }
      if (status && status !== 'all') {
        hostings = hostings.filter(h => h.status === status);
      }
      if (clientId) {
        hostings = hostings.filter(h => String(h.client_id) === String(clientId));
      }
    } else {
      let sql = `
        SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM hostings h
        LEFT JOIN clients c ON h.client_id = c.id
        WHERE h.user_id = ?
      `;
      const params = [userId];

      if (search) {
        sql += ` AND (h.package_name LIKE ? OR h.primary_domain LIKE ? OR c.name LIKE ? OR h.provider LIKE ? OR h.server_name LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q, q);
      }
      if (server && server !== 'all') {
        sql += ` AND h.server_name = ?`;
        params.push(server);
      }
      if (provider && provider !== 'all') {
        sql += ` AND h.provider = ?`;
        params.push(provider);
      }
      if (status && status !== 'all') {
        sql += ` AND h.status = ?`;
        params.push(status);
      }
      if (clientId) {
        sql += ` AND h.client_id = ?`;
        params.push(clientId);
      }

      sql += ` ORDER BY h.expiry_date ASC`;

      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = (parseInt(req.query.page, 10) - 1 || 0) * limit;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, Math.max(0, offset));

      hostings = await query(sql, params);
      domains = await query(`SELECT id, domain_name FROM domains WHERE user_id = ?`, [userId]);
    }

    hostings = hostings.map(h => {
      const days = getDaysRemaining(h.expiry_date);
      const linkedD = h.linked_domain_id ? domains.find(d => String(d.id) === String(d.linked_domain_id)) : null;

      return {
        ...h,
        days_remaining: days,
        status: calculateStatus(days, h.status),
        linked_domain_name: linkedD ? linkedD.domain_name : null
      };
    });

    hostings.sort((a, b) => a.days_remaining - b.days_remaining);

    res.json({ success: true, count: hostings.length, data: hostings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getHostingById = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    let hosting = null;

    if (isMockMode()) {
      hosting = mockData.hostings.find(h => String(h.id) === String(id) && h.user_id === userId);
    } else {
      const rows = await query(`
        SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM hostings h
        LEFT JOIN clients c ON h.client_id = c.id
        WHERE h.id = ? AND h.user_id = ?
      `, [id, userId]);
      hosting = rows[0] || null;
    }

    if (!hosting) {
      return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });
    }

    hosting.days_remaining = getDaysRemaining(hosting.expiry_date);
    hosting.status = calculateStatus(hosting.days_remaining, hosting.status);
    res.json({ success: true, data: hosting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createHosting = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const {
      client_id,
      linked_domain_id,
      is_bundle = 0,
      package_name,
      provider = 'Namecheap',
      server_name = 'Cloud Server 1',
      ip_address = '192.0.2.1',
      primary_domain,
      start_date,
      expiry_date,
      billing_cycle = 'annual',
      cost_price = 0,
      client_price = 0,
      notes = ''
    } = req.body;

    if (!package_name || !expiry_date) {
      return res.status(400).json({ success: false, message: 'Package name and expiry date are required' });
    }

    // Verify client belongs to user if specified
    if (client_id) {
      if (isMockMode()) {
        const client = mockData.clients.find(c => String(c.id) === String(client_id) && c.user_id === userId);
        if (!client) return res.status(404).json({ success: false, message: 'Client not found or access denied' });
      } else {
        const clientRows = await query(`SELECT id FROM clients WHERE id = ? AND user_id = ?`, [client_id, userId]);
        if (!clientRows.length) return res.status(404).json({ success: false, message: 'Client not found or access denied' });
      }
    }

    const daysLeft = getDaysRemaining(expiry_date);
    const status = calculateStatus(daysLeft, 'active');

    if (isMockMode()) {
      const client = mockData.clients.find(c => String(c.id) === String(client_id) && c.user_id === userId);
      const newHosting = {
        id: Date.now(),
        user_id: userId,
        client_id: client_id ? Number(client_id) : null,
        linked_domain_id: linked_domain_id ? Number(linked_domain_id) : null,
        is_bundle: Boolean(is_bundle) ? 1 : 0,
        client_name: client ? client.name : null,
        client_phone: client ? client.phone : null,
        client_company: client ? client.company : null,
        package_name: package_name.trim(),
        provider,
        server_name,
        ip_address,
        primary_domain: primary_domain ? primary_domain.trim().toLowerCase() : '',
        start_date: start_date || null,
        expiry_date,
        billing_cycle,
        cost_price: Number(cost_price) || 0,
        client_price: Number(client_price) || 0,
        status,
        notes,
        last_notified_tier: null,
        days_remaining: daysLeft,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.hostings.unshift(newHosting);
      return res.status(201).json({ success: true, data: newHosting });
    }

    const result = await query(`
      INSERT INTO hostings (user_id, client_id, linked_domain_id, is_bundle, package_name, provider, server_name, ip_address, primary_domain, start_date, expiry_date, billing_cycle, cost_price, client_price, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      client_id || null,
      linked_domain_id || null,
      is_bundle ? 1 : 0,
      package_name.trim(),
      provider,
      server_name,
      ip_address,
      primary_domain ? primary_domain.trim().toLowerCase() : null,
      start_date || null,
      expiry_date,
      billing_cycle,
      cost_price,
      client_price,
      status,
      notes
    ]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateHosting = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const {
      client_id,
      linked_domain_id,
      is_bundle,
      package_name,
      provider,
      server_name,
      ip_address,
      primary_domain,
      start_date,
      expiry_date,
      billing_cycle,
      cost_price,
      client_price,
      status,
      notes
    } = req.body;

    if (isMockMode()) {
      const index = mockData.hostings.findIndex(h => String(h.id) === String(id) && h.user_id === userId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });

      const client = mockData.clients.find(c => String(c.id) === String(client_id) && c.user_id === userId);
      const exp = expiry_date || mockData.hostings[index].expiry_date;
      const days = getDaysRemaining(exp);

      mockData.hostings[index] = {
        ...mockData.hostings[index],
        client_id: client_id !== undefined ? (client_id ? Number(client_id) : null) : mockData.hostings[index].client_id,
        linked_domain_id: linked_domain_id !== undefined ? (linked_domain_id ? Number(linked_domain_id) : null) : mockData.hostings[index].linked_domain_id,
        is_bundle: is_bundle !== undefined ? (is_bundle ? 1 : 0) : mockData.hostings[index].is_bundle,
        client_name: client ? client.name : mockData.hostings[index].client_name,
        client_phone: client ? client.phone : mockData.hostings[index].client_phone,
        client_company: client ? client.company : mockData.hostings[index].client_company,
        package_name: package_name || mockData.hostings[index].package_name,
        provider: provider || mockData.hostings[index].provider,
        server_name: server_name || mockData.hostings[index].server_name,
        ip_address: ip_address || mockData.hostings[index].ip_address,
        primary_domain: primary_domain !== undefined ? primary_domain : mockData.hostings[index].primary_domain,
        start_date: start_date || mockData.hostings[index].start_date,
        expiry_date: exp,
        billing_cycle: billing_cycle || mockData.hostings[index].billing_cycle,
        cost_price: cost_price !== undefined ? Number(cost_price) : mockData.hostings[index].cost_price,
        client_price: client_price !== undefined ? Number(client_price) : mockData.hostings[index].client_price,
        status: status || calculateStatus(days, 'active'),
        notes: notes !== undefined ? notes : mockData.hostings[index].notes,
        days_remaining: days,
        updated_at: new Date()
      };

      return res.json({ success: true, data: mockData.hostings[index] });
    }

    await query(`
      UPDATE hostings SET
        client_id = ?, linked_domain_id = ?, is_bundle = ?, package_name = ?, provider = ?, server_name = ?, ip_address = ?,
        primary_domain = ?, start_date = ?, expiry_date = ?, billing_cycle = ?,
        cost_price = ?, client_price = ?, status = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `, [
      client_id || null,
      linked_domain_id || null,
      is_bundle ? 1 : 0,
      package_name,
      provider,
      server_name,
      ip_address,
      primary_domain,
      start_date || null,
      expiry_date,
      billing_cycle,
      cost_price,
      client_price,
      status,
      notes,
      id,
      userId
    ]);

    res.json({ success: true, message: 'Hosting updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.renewHosting = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const months = parseInt(req.body.months, 10) || 12;

    if (isMockMode()) {
      const target = mockData.hostings.find(h => String(h.id) === String(id) && h.user_id === userId);
      if (!target) return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });

      target.expiry_date = addMonthsToDate(target.expiry_date, months);
      target.last_notified_tier = null;
      target.status = 'active';
      target.days_remaining = getDaysRemaining(target.expiry_date);

      return res.json({ success: true, message: `Renewed hosting for ${months} month(s)`, data: target });
    }

    const rows = await query(`SELECT * FROM hostings WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });

    const newExpiry = addMonthsToDate(rows[0].expiry_date, months);

    await query(`
      UPDATE hostings SET expiry_date = ?, last_notified_tier = NULL, status = 'active' WHERE id = ? AND user_id = ?
    `, [newExpiry, id, userId]);

    res.json({ success: true, message: `Hosting renewed until ${newExpiry}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteHosting = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;

    if (isMockMode()) {
      const idx = mockData.hostings.findIndex(h => String(h.id) === String(id) && h.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Hosting package not found or access denied' });

      mockData.hostings.splice(idx, 1);
      mockData.domains.forEach(d => {
        if (String(d.linked_hosting_id) === String(id) && d.user_id === userId) {
          d.linked_hosting_id = null;
          d.is_bundle = 0;
        }
      });
      return res.json({ success: true, message: 'Hosting package deleted' });
    }

    await query(`UPDATE domains SET linked_hosting_id = NULL, is_bundle = 0 WHERE linked_hosting_id = ? AND user_id = ?`, [id, userId]);
    await query(`DELETE FROM hostings WHERE id = ? AND user_id = ?`, [id, userId]);
    res.json({ success: true, message: 'Hosting package deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
