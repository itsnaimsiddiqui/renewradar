const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');

function calculateStatus(daysLeft, currentStatus) {
  if (currentStatus === 'suspended' || currentStatus === 'cancelled') {
    return currentStatus;
  }
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'active';
}

exports.getAllHostings = async (req, res) => {
  try {
    const { search, server, provider, status, clientId } = req.query;

    let hostings = [];
    let domains = [];

    if (isMockMode()) {
      hostings = [...mockData.hostings];
      domains = [...mockData.domains];
    } else {
      hostings = await query(`
        SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM hostings h
        LEFT JOIN clients c ON h.client_id = c.id
        ORDER BY h.expiry_date ASC
      `);
      domains = await query(`SELECT id, domain_name FROM domains`);
    }

    hostings = hostings.map(h => {
      const days = getDaysRemaining(h.expiry_date);
      const linkedD = h.linked_domain_id ? domains.find(d => String(d.id) === String(h.linked_domain_id)) : null;

      return {
        ...h,
        days_remaining: days,
        status: calculateStatus(days, h.status),
        linked_domain_name: linkedD ? linkedD.domain_name : null
      };
    });

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

    hostings.sort((a, b) => a.days_remaining - b.days_remaining);

    res.json({ success: true, count: hostings.length, data: hostings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getHostingById = async (req, res) => {
  try {
    const { id } = req.params;
    let hosting = null;

    if (isMockMode()) {
      hosting = mockData.hostings.find(h => String(h.id) === String(id));
    } else {
      const rows = await query(`
        SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM hostings h
        LEFT JOIN clients c ON h.client_id = c.id
        WHERE h.id = ?
      `, [id]);
      hosting = rows[0] || null;
    }

    if (!hosting) {
      return res.status(404).json({ success: false, message: 'Hosting package not found' });
    }

    hosting.days_remaining = getDaysRemaining(hosting.expiry_date);
    res.json({ success: true, data: hosting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createHosting = async (req, res) => {
  try {
    const {
      client_id,
      linked_domain_id,
      is_bundle = 0,
      package_name,
      provider = 'Namecheap',
      server_name = 's12018',
      ip_address = '209.42.27.76',
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

    const daysLeft = getDaysRemaining(expiry_date);
    const status = calculateStatus(daysLeft, 'active');

    if (isMockMode()) {
      const client = mockData.clients.find(c => String(c.id) === String(client_id));
      const newHosting = {
        id: Date.now(),
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
      INSERT INTO hostings (client_id, linked_domain_id, is_bundle, package_name, provider, server_name, ip_address, primary_domain, start_date, expiry_date, billing_cycle, cost_price, client_price, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      const index = mockData.hostings.findIndex(h => String(h.id) === String(id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Hosting package not found' });

      const client = mockData.clients.find(c => String(c.id) === String(client_id));
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
      WHERE id = ?
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
      id
    ]);

    res.json({ success: true, message: 'Hosting updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.renewHosting = async (req, res) => {
  try {
    const { id } = req.params;
    const months = parseInt(req.body.months, 10) || 12;

    if (isMockMode()) {
      const target = mockData.hostings.find(h => String(h.id) === String(id));
      if (!target) return res.status(404).json({ success: false, message: 'Hosting package not found' });

      const currentExp = new Date(target.expiry_date);
      const baseDate = currentExp < new Date() ? new Date() : currentExp;
      baseDate.setMonth(baseDate.getMonth() + months);
      target.expiry_date = baseDate.toISOString().split('T')[0];
      target.last_notified_tier = null;
      target.status = 'active';
      target.days_remaining = getDaysRemaining(target.expiry_date);

      return res.json({ success: true, message: `Renewed hosting for ${months} month(s)`, data: target });
    }

    const rows = await query(`SELECT * FROM hostings WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Hosting package not found' });

    const currentExp = new Date(rows[0].expiry_date);
    const baseDate = currentExp < new Date() ? new Date() : currentExp;
    baseDate.setMonth(baseDate.getMonth() + months);
    const newExpiry = baseDate.toISOString().split('T')[0];

    await query(`
      UPDATE hostings SET expiry_date = ?, last_notified_tier = NULL, status = 'active' WHERE id = ?
    `, [newExpiry, id]);

    res.json({ success: true, message: `Hosting renewed until ${newExpiry}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteHosting = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      mockData.hostings = mockData.hostings.filter(h => String(h.id) !== String(id));
      mockData.domains.forEach(d => {
        if (String(d.linked_hosting_id) === String(id)) {
          d.linked_hosting_id = null;
          d.is_bundle = 0;
        }
      });
      return res.json({ success: true, message: 'Hosting package deleted' });
    }

    await query(`UPDATE domains SET linked_hosting_id = NULL, is_bundle = 0 WHERE linked_hosting_id = ?`, [id]);
    await query(`DELETE FROM hostings WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Hosting package deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
