const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');

exports.getAllClients = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user authentication' });
    }
    const userId = req.user.id || req.user.user_id;
    const { search } = req.query;

    let clients = [];
    let domains = [];
    let hostings = [];

    if (isMockMode()) {
      clients = mockData.clients.filter(c => c.user_id === userId);
      domains = mockData.domains.filter(d => d.user_id === userId);
      hostings = mockData.hostings.filter(h => h.user_id === userId);

      if (search) {
        const q = search.toLowerCase();
        clients = clients.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      }
    } else {
      let sql = `SELECT * FROM clients WHERE user_id = ?`;
      const params = [userId];

      if (search) {
        sql += ` AND (name LIKE ? OR company LIKE ? OR phone LIKE ? OR email LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }

      sql += ` ORDER BY name ASC`;

      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = (parseInt(req.query.page, 10) - 1 || 0) * limit;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, Math.max(0, offset));

      clients = await query(sql, params);
      domains = await query(`SELECT id, client_id, domain_name, expiry_date, client_price, status FROM domains WHERE user_id = ?`, [userId]);
      hostings = await query(`SELECT id, client_id, package_name, primary_domain, expiry_date, client_price, status FROM hostings WHERE user_id = ?`, [userId]);
    }

    // Build O(1) HashMaps keyed by client_id to prevent O(N*M) nested filtering
    const domainMap = new Map();
    domains.forEach(d => {
      const cid = String(d.client_id);
      if (!domainMap.has(cid)) domainMap.set(cid, []);
      domainMap.get(cid).push(d);
    });

    const hostingMap = new Map();
    hostings.forEach(h => {
      const cid = String(h.client_id);
      if (!hostingMap.has(cid)) hostingMap.set(cid, []);
      hostingMap.get(cid).push(h);
    });

    // Augment clients with their active assets and urgent alerts in O(1) per client
    const enrichedClients = clients.map(c => {
      const cid = String(c.id);
      const clientDomains = domainMap.get(cid) || [];
      const clientHostings = hostingMap.get(cid) || [];

      let hasExpired = false;
      let hasExpiringSoon = false;

      clientDomains.forEach(d => {
        const days = getDaysRemaining(d.expiry_date);
        if (days < 0) hasExpired = true;
        else if (days <= 7) hasExpiringSoon = true;
      });

      clientHostings.forEach(h => {
        const days = getDaysRemaining(h.expiry_date);
        if (days < 0) hasExpired = true;
        else if (days <= 7) hasExpiringSoon = true;
      });

      return {
        ...c,
        total_domains: clientDomains.length,
        total_hostings: clientHostings.length,
        has_expired: hasExpired,
        has_expiring_soon: hasExpiringSoon,
        domains: clientDomains,
        hostings: clientHostings
      };
    });

    res.json({ success: true, count: enrichedClients.length, data: enrichedClients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    let client = null;
    let clientDomains = [];
    let clientHostings = [];

    if (isMockMode()) {
      client = mockData.clients.find(c => String(c.id) === String(id) && c.user_id === userId);
      if (client) {
        clientDomains = mockData.domains.filter(d => String(d.client_id) === String(id) && d.user_id === userId);
        clientHostings = mockData.hostings.filter(h => String(h.client_id) === String(id) && h.user_id === userId);
      }
    } else {
      const rows = await query(`SELECT * FROM clients WHERE id = ? AND user_id = ?`, [id, userId]);
      client = rows[0] || null;
      if (client) {
        clientDomains = await query(`SELECT * FROM domains WHERE client_id = ? AND user_id = ? ORDER BY expiry_date ASC`, [id, userId]);
        clientHostings = await query(`SELECT * FROM hostings WHERE client_id = ? AND user_id = ? ORDER BY expiry_date ASC`, [id, userId]);
      }
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found or access denied' });
    }

    clientDomains = clientDomains.map(d => ({ ...d, days_remaining: getDaysRemaining(d.expiry_date) }));
    clientHostings = clientHostings.map(h => ({ ...h, days_remaining: getDaysRemaining(h.expiry_date) }));

    res.json({
      success: true,
      data: {
        ...client,
        domains: clientDomains,
        hostings: clientHostings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { name, company, phone, email, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
    }

    if (isMockMode()) {
      const newClient = {
        id: Date.now(),
        user_id: userId,
        name: name.trim(),
        company: company ? company.trim() : '',
        phone: phone.trim(),
        email: email ? email.trim() : '',
        notes: notes || '',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.clients.unshift(newClient);
      return res.status(201).json({ success: true, data: newClient });
    }

    const result = await query(`
      INSERT INTO clients (user_id, name, company, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, name.trim(), company ? company.trim() : null, phone.trim(), email ? email.trim() : null, notes || null]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const { name, company, phone, email, notes } = req.body;

    if (isMockMode()) {
      const idx = mockData.clients.findIndex(c => String(c.id) === String(id) && c.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Client not found or access denied' });

      mockData.clients[idx] = {
        ...mockData.clients[idx],
        name: name !== undefined ? name.trim() : mockData.clients[idx].name,
        company: company !== undefined ? company.trim() : mockData.clients[idx].company,
        phone: phone !== undefined ? phone.trim() : mockData.clients[idx].phone,
        email: email !== undefined ? email.trim() : mockData.clients[idx].email,
        notes: notes !== undefined ? notes : mockData.clients[idx].notes,
        updated_at: new Date()
      };

      return res.json({ success: true, data: mockData.clients[idx] });
    }

    await query(`
      UPDATE clients SET name = ?, company = ?, phone = ?, email = ?, notes = ? WHERE id = ? AND user_id = ?
    `, [name, company || null, phone, email || null, notes || null, id, userId]);

    res.json({ success: true, message: 'Client updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;

    if (isMockMode()) {
      const idx = mockData.clients.findIndex(c => String(c.id) === String(id) && c.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Client not found or access denied' });

      mockData.clients.splice(idx, 1);
      mockData.domains.forEach(d => {
        if (String(d.client_id) === String(id) && d.user_id === userId) {
          d.client_id = null;
          d.client_name = null;
          d.client_phone = null;
        }
      });
      mockData.hostings.forEach(h => {
        if (String(h.client_id) === String(id) && h.user_id === userId) {
          h.client_id = null;
          h.client_name = null;
          h.client_phone = null;
        }
      });
      return res.json({ success: true, message: 'Client deleted' });
    }

    await query(`DELETE FROM clients WHERE id = ? AND user_id = ?`, [id, userId]);
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
