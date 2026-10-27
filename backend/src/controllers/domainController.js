const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');
const { calculateStatus, addYearsToDate } = require('../utils/statusHelper');

exports.getAllDomains = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user authentication' });
    }
    const userId = req.user.id || req.user.user_id;
    const { search, account, status, clientId } = req.query;

    let domains = [];
    let hostings = [];

    if (isMockMode()) {
      domains = mockData.domains.filter(d => d.user_id === userId);
      hostings = mockData.hostings.filter(h => h.user_id === userId);

      if (search) {
        const q = search.toLowerCase();
        domains = domains.filter(d =>
          d.domain_name.toLowerCase().includes(q) ||
          (d.client_name && d.client_name.toLowerCase().includes(q)) ||
          (d.notes && d.notes.toLowerCase().includes(q)) ||
          (d.account_label && d.account_label.toLowerCase().includes(q))
        );
      }
      if (account && account !== 'all') {
        domains = domains.filter(d => d.account_label === account || d.registrar === account);
      }
      if (status && status !== 'all') {
        domains = domains.filter(d => d.status === status);
      }
      if (clientId) {
        domains = domains.filter(d => String(d.client_id) === String(clientId));
      }
    } else {
      let sql = `
        SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM domains d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.user_id = ?
      `;
      const params = [userId];

      if (search) {
        sql += ` AND (d.domain_name LIKE ? OR c.name LIKE ? OR d.notes LIKE ? OR d.account_label LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }
      if (account && account !== 'all') {
        sql += ` AND (d.account_label = ? OR d.registrar = ?)`;
        params.push(account, account);
      }
      if (status && status !== 'all') {
        sql += ` AND d.status = ?`;
        params.push(status);
      }
      if (clientId) {
        sql += ` AND d.client_id = ?`;
        params.push(clientId);
      }

      sql += ` ORDER BY d.expiry_date ASC`;

      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = (parseInt(req.query.page, 10) - 1 || 0) * limit;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, Math.max(0, offset));

      domains = await query(sql, params);
      hostings = await query(`SELECT id, package_name, provider FROM hostings WHERE user_id = ?`, [userId]);
    }

    // Attach days remaining, calculated status, and linked hosting package name
    domains = domains.map(d => {
      const days = getDaysRemaining(d.expiry_date);
      const linkedH = d.linked_hosting_id ? hostings.find(h => String(h.id) === String(d.linked_hosting_id)) : null;

      return {
        ...d,
        days_remaining: days,
        status: calculateStatus(days, d.status),
        linked_hosting_name: linkedH ? linkedH.package_name : null
      };
    });

    domains.sort((a, b) => a.days_remaining - b.days_remaining);

    res.json({ success: true, count: domains.length, data: domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDomainById = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    let domain = null;

    if (isMockMode()) {
      domain = mockData.domains.find(d => String(d.id) === String(id) && d.user_id === userId);
    } else {
      const rows = await query(`
        SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM domains d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.id = ? AND d.user_id = ?
      `, [id, userId]);
      domain = rows[0] || null;
    }

    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found or access denied' });
    }

    domain.days_remaining = getDaysRemaining(domain.expiry_date);
    domain.status = calculateStatus(domain.days_remaining, domain.status);
    res.json({ success: true, data: domain });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createDomain = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const {
      client_id,
      linked_hosting_id,
      is_bundle = 0,
      domain_name,
      registrar = 'Namecheap',
      account_label = 'Namecheap Account 1',
      registration_date,
      expiry_date,
      auto_renew = 0,
      cost_price = 0,
      client_price = 0,
      notes = ''
    } = req.body;

    if (!domain_name || !expiry_date) {
      return res.status(400).json({ success: false, message: 'Domain name and expiry date are required' });
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
      const newDomain = {
        id: Date.now(),
        user_id: userId,
        client_id: client_id ? Number(client_id) : null,
        linked_hosting_id: linked_hosting_id ? Number(linked_hosting_id) : null,
        is_bundle: Boolean(is_bundle) ? 1 : 0,
        client_name: client ? client.name : null,
        client_phone: client ? client.phone : null,
        client_company: client ? client.company : null,
        domain_name: domain_name.trim().toLowerCase(),
        registrar,
        account_label,
        registration_date,
        expiry_date,
        auto_renew: Boolean(auto_renew) ? 1 : 0,
        cost_price: Number(cost_price) || 0,
        client_price: Number(client_price) || 0,
        status,
        notes,
        last_notified_tier: null,
        days_remaining: daysLeft,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.domains.unshift(newDomain);
      return res.status(201).json({ success: true, data: newDomain });
    }

    const result = await query(`
      INSERT INTO domains (user_id, client_id, linked_hosting_id, is_bundle, domain_name, registrar, account_label, registration_date, expiry_date, auto_renew, cost_price, client_price, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      client_id || null,
      linked_hosting_id || null,
      is_bundle ? 1 : 0,
      domain_name.trim().toLowerCase(),
      registrar,
      account_label,
      registration_date || null,
      expiry_date,
      auto_renew ? 1 : 0,
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

exports.updateDomain = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const {
      client_id,
      linked_hosting_id,
      is_bundle,
      domain_name,
      registrar,
      account_label,
      registration_date,
      expiry_date,
      auto_renew,
      cost_price,
      client_price,
      status,
      notes
    } = req.body;

    if (isMockMode()) {
      const index = mockData.domains.findIndex(d => String(d.id) === String(id) && d.user_id === userId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Domain not found or access denied' });

      const client = mockData.clients.find(c => String(c.id) === String(client_id) && c.user_id === userId);
      const exp = expiry_date || mockData.domains[index].expiry_date;
      const days = getDaysRemaining(exp);

      mockData.domains[index] = {
        ...mockData.domains[index],
        client_id: client_id !== undefined ? (client_id ? Number(client_id) : null) : mockData.domains[index].client_id,
        linked_hosting_id: linked_hosting_id !== undefined ? (linked_hosting_id ? Number(linked_hosting_id) : null) : mockData.domains[index].linked_hosting_id,
        is_bundle: is_bundle !== undefined ? (is_bundle ? 1 : 0) : mockData.domains[index].is_bundle,
        client_name: client ? client.name : mockData.domains[index].client_name,
        client_phone: client ? client.phone : mockData.domains[index].client_phone,
        client_company: client ? client.company : mockData.domains[index].client_company,
        domain_name: domain_name ? domain_name.trim().toLowerCase() : mockData.domains[index].domain_name,
        registrar: registrar || mockData.domains[index].registrar,
        account_label: account_label || mockData.domains[index].account_label,
        registration_date: registration_date || mockData.domains[index].registration_date,
        expiry_date: exp,
        auto_renew: auto_renew !== undefined ? (auto_renew ? 1 : 0) : mockData.domains[index].auto_renew,
        cost_price: cost_price !== undefined ? Number(cost_price) : mockData.domains[index].cost_price,
        client_price: client_price !== undefined ? Number(client_price) : mockData.domains[index].client_price,
        status: status || calculateStatus(days, 'active'),
        notes: notes !== undefined ? notes : mockData.domains[index].notes,
        days_remaining: days,
        updated_at: new Date()
      };

      return res.json({ success: true, data: mockData.domains[index] });
    }

    await query(`
      UPDATE domains SET
        client_id = ?, linked_hosting_id = ?, is_bundle = ?, domain_name = ?, registrar = ?, account_label = ?,
        registration_date = ?, expiry_date = ?, auto_renew = ?,
        cost_price = ?, client_price = ?, status = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `, [
      client_id || null,
      linked_hosting_id || null,
      is_bundle ? 1 : 0,
      domain_name.trim().toLowerCase(),
      registrar,
      account_label,
      registration_date || null,
      expiry_date,
      auto_renew ? 1 : 0,
      cost_price,
      client_price,
      status,
      notes,
      id,
      userId
    ]);

    res.json({ success: true, message: 'Domain updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.renewDomain = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const years = parseInt(req.body.years, 10) || 1;

    let target = null;
    if (isMockMode()) {
      target = mockData.domains.find(d => String(d.id) === String(id) && d.user_id === userId);
      if (!target) return res.status(404).json({ success: false, message: 'Domain not found or access denied' });

      target.expiry_date = addYearsToDate(target.expiry_date, years);
      target.last_notified_tier = null;
      target.status = 'active';
      target.days_remaining = getDaysRemaining(target.expiry_date);

      return res.json({ success: true, message: `Renewed for ${years} year(s)`, data: target });
    }

    const rows = await query(`SELECT * FROM domains WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Domain not found or access denied' });

    const newExpiry = addYearsToDate(rows[0].expiry_date, years);

    await query(`
      UPDATE domains SET expiry_date = ?, last_notified_tier = NULL, status = 'active' WHERE id = ? AND user_id = ?
    `, [newExpiry, id, userId]);

    res.json({ success: true, message: `Domain renewed until ${newExpiry}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;

    if (isMockMode()) {
      const idx = mockData.domains.findIndex(d => String(d.id) === String(id) && d.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Domain not found or access denied' });

      mockData.domains.splice(idx, 1);
      mockData.hostings.forEach(h => {
        if (String(h.linked_domain_id) === String(id) && h.user_id === userId) {
          h.linked_domain_id = null;
          h.is_bundle = 0;
        }
      });
      return res.json({ success: true, message: 'Domain deleted' });
    }

    await query(`UPDATE hostings SET linked_domain_id = NULL, is_bundle = 0 WHERE linked_domain_id = ? AND user_id = ?`, [id, userId]);
    await query(`DELETE FROM domains WHERE id = ? AND user_id = ?`, [id, userId]);
    res.json({ success: true, message: 'Domain deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
