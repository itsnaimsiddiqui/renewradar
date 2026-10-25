const { isMockMode, mockData, query } = require('../config/db');
const { getDaysRemaining } = require('../services/telegramBot');

function calculateStatus(daysLeft, currentStatus) {
  if (currentStatus === 'transferred' || currentStatus === 'cancelled') {
    return currentStatus;
  }
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'active';
}

exports.getAllDomains = async (req, res) => {
  try {
    const { search, account, status, clientId } = req.query;

    let domains = [];
    let hostings = [];

    if (isMockMode()) {
      domains = [...mockData.domains];
      hostings = [...mockData.hostings];
    } else {
      domains = await query(`
        SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM domains d
        LEFT JOIN clients c ON d.client_id = c.id
        ORDER BY d.expiry_date ASC
      `);
      hostings = await query(`SELECT id, package_name, provider FROM hostings`);
    }

    // Attach days remaining, status, and linked hosting package name if bundle
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

    domains.sort((a, b) => a.days_remaining - b.days_remaining);

    res.json({ success: true, count: domains.length, data: domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDomainById = async (req, res) => {
  try {
    const { id } = req.params;
    let domain = null;

    if (isMockMode()) {
      domain = mockData.domains.find(d => String(d.id) === String(id));
    } else {
      const rows = await query(`
        SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
        FROM domains d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.id = ?
      `, [id]);
      domain = rows[0] || null;
    }

    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }

    domain.days_remaining = getDaysRemaining(domain.expiry_date);
    res.json({ success: true, data: domain });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createDomain = async (req, res) => {
  try {
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

    const daysLeft = getDaysRemaining(expiry_date);
    const status = calculateStatus(daysLeft, 'active');

    if (isMockMode()) {
      const client = mockData.clients.find(c => String(c.id) === String(client_id));
      const newDomain = {
        id: Date.now(),
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
      INSERT INTO domains (client_id, linked_hosting_id, is_bundle, domain_name, registrar, account_label, registration_date, expiry_date, auto_renew, cost_price, client_price, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      notes
    ]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateDomain = async (req, res) => {
  try {
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
      const index = mockData.domains.findIndex(d => String(d.id) === String(id));
      if (index === -1) return res.status(404).json({ success: false, message: 'Domain not found' });

      const client = mockData.clients.find(c => String(c.id) === String(client_id));
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
      WHERE id = ?
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
      id
    ]);

    res.json({ success: true, message: 'Domain updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.renewDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const years = parseInt(req.body.years, 10) || 1;

    let target = null;
    if (isMockMode()) {
      target = mockData.domains.find(d => String(d.id) === String(id));
      if (!target) return res.status(404).json({ success: false, message: 'Domain not found' });

      const currentExp = new Date(target.expiry_date);
      const baseDate = currentExp < new Date() ? new Date() : currentExp;
      baseDate.setFullYear(baseDate.getFullYear() + years);
      target.expiry_date = baseDate.toISOString().split('T')[0];
      target.last_notified_tier = null;
      target.status = 'active';
      target.days_remaining = getDaysRemaining(target.expiry_date);

      return res.json({ success: true, message: `Renewed for ${years} year(s)`, data: target });
    }

    const rows = await query(`SELECT * FROM domains WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Domain not found' });

    const currentExp = new Date(rows[0].expiry_date);
    const baseDate = currentExp < new Date() ? new Date() : currentExp;
    baseDate.setFullYear(baseDate.getFullYear() + years);
    const newExpiry = baseDate.toISOString().split('T')[0];

    await query(`
      UPDATE domains SET expiry_date = ?, last_notified_tier = NULL, status = 'active' WHERE id = ?
    `, [newExpiry, id]);

    res.json({ success: true, message: `Domain renewed until ${newExpiry}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      mockData.domains = mockData.domains.filter(d => String(d.id) !== String(id));
      // Unlink in hostings if was bundle
      mockData.hostings.forEach(h => {
        if (String(h.linked_domain_id) === String(id)) {
          h.linked_domain_id = null;
          h.is_bundle = 0;
        }
      });
      return res.json({ success: true, message: 'Domain deleted' });
    }

    await query(`UPDATE hostings SET linked_domain_id = NULL, is_bundle = 0 WHERE linked_domain_id = ?`, [id]);
    await query(`DELETE FROM domains WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Domain deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
