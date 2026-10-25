const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');

exports.getAllClients = async (req, res) => {
  try {
    const { search } = req.query;

    let clients = [];
    let domains = [];
    let hostings = [];

    if (isMockMode()) {
      clients = [...mockData.clients];
      domains = [...mockData.domains];
      hostings = [...mockData.hostings];
    } else {
      clients = await query(`SELECT * FROM clients ORDER BY name ASC`);
      domains = await query(`SELECT id, client_id, domain_name, expiry_date, client_price, status FROM domains`);
      hostings = await query(`SELECT id, client_id, package_name, primary_domain, expiry_date, client_price, status FROM hostings`);
    }

    // Augment clients with their active assets and urgent alerts
    const enrichedClients = clients.map(c => {
      const clientDomains = domains.filter(d => String(d.client_id) === String(c.id));
      const clientHostings = hostings.filter(h => String(h.client_id) === String(c.id));

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

    let results = enrichedClients;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    let client = null;
    let clientDomains = [];
    let clientHostings = [];

    if (isMockMode()) {
      client = mockData.clients.find(c => String(c.id) === String(id));
      if (client) {
        clientDomains = mockData.domains.filter(d => String(d.client_id) === String(id));
        clientHostings = mockData.hostings.filter(h => String(h.client_id) === String(id));
      }
    } else {
      const rows = await query(`SELECT * FROM clients WHERE id = ?`, [id]);
      client = rows[0] || null;
      if (client) {
        clientDomains = await query(`SELECT * FROM domains WHERE client_id = ? ORDER BY expiry_date ASC`, [id]);
        clientHostings = await query(`SELECT * FROM hostings WHERE client_id = ? ORDER BY expiry_date ASC`, [id]);
      }
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
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
    const { name, company, phone, email, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
    }

    if (isMockMode()) {
      const newClient = {
        id: Date.now(),
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
      INSERT INTO clients (name, company, phone, email, notes) VALUES (?, ?, ?, ?, ?)
    `, [name.trim(), company ? company.trim() : null, phone.trim(), email ? email.trim() : null, notes || null]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, phone, email, notes } = req.body;

    if (isMockMode()) {
      const idx = mockData.clients.findIndex(c => String(c.id) === String(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Client not found' });

      mockData.clients[idx] = {
        ...mockData.clients[idx],
        name: name !== undefined ? name.trim() : mockData.clients[idx].name,
        company: company !== undefined ? company.trim() : mockData.clients[idx].company,
        phone: phone !== undefined ? phone.trim() : mockData.clients[idx].phone,
        email: email !== undefined ? email.trim() : mockData.clients[idx].email,
        notes: notes !== undefined ? notes : mockData.clients[idx].notes,
        updated_at: new Date()
      };

      // Also sync client name & phone in domains and hostings for convenience
      mockData.domains.forEach(d => {
        if (String(d.client_id) === String(id)) {
          d.client_name = mockData.clients[idx].name;
          d.client_phone = mockData.clients[idx].phone;
          d.client_company = mockData.clients[idx].company;
        }
      });
      mockData.hostings.forEach(h => {
        if (String(h.client_id) === String(id)) {
          h.client_name = mockData.clients[idx].name;
          h.client_phone = mockData.clients[idx].phone;
          h.client_company = mockData.clients[idx].company;
        }
      });

      return res.json({ success: true, data: mockData.clients[idx] });
    }

    await query(`
      UPDATE clients SET name = ?, company = ?, phone = ?, email = ?, notes = ? WHERE id = ?
    `, [name, company || null, phone, email || null, notes || null, id]);

    res.json({ success: true, message: 'Client updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode()) {
      mockData.clients = mockData.clients.filter(c => String(c.id) !== String(id));
      // Unlink in domains & hostings
      mockData.domains.forEach(d => {
        if (String(d.client_id) === String(id)) {
          d.client_id = null;
          d.client_name = null;
          d.client_phone = null;
        }
      });
      mockData.hostings.forEach(h => {
        if (String(h.client_id) === String(id)) {
          h.client_id = null;
          h.client_name = null;
          h.client_phone = null;
        }
      });
      return res.json({ success: true, message: 'Client deleted' });
    }

    await query(`DELETE FROM clients WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
