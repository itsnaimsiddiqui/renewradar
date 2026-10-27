const { isMockMode, mockData, query } = require('../config/db');

exports.getAllPlatforms = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;

    let platforms = [];
    if (isMockMode()) {
      platforms = mockData.platforms.filter(p => p.user_id === userId);
    } else {
      platforms = await query(`SELECT * FROM platforms WHERE user_id = ? ORDER BY name ASC`, [userId]);
    }

    // Attach count of active domains & hostings on each platform
    let domains = isMockMode() ? mockData.domains.filter(d => d.user_id === userId) : await query(`SELECT id, account_label, registrar FROM domains WHERE user_id = ?`, [userId]);
    let hostings = isMockMode() ? mockData.hostings.filter(h => h.user_id === userId) : await query(`SELECT id, provider FROM hostings WHERE user_id = ?`, [userId]);

    platforms = platforms.map(p => {
      const domainCount = domains.filter(d => d.account_label === p.name || d.registrar === p.name).length;
      const hostingCount = hostings.filter(h => h.provider === p.name).length;
      return {
        ...p,
        total_domains: domainCount,
        total_hostings: hostingCount,
        total_assets: domainCount + hostingCount
      };
    });

    res.json({ success: true, count: platforms.length, data: platforms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createPlatform = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { name, type = 'both', website = '', account_identifier = '', notes = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Platform name is required (e.g. Hostinger, HostGator, Namecheap)' });
    }

    const cleanName = name.trim();

    if (isMockMode()) {
      const exists = mockData.platforms.some(p => p.name.toLowerCase() === cleanName.toLowerCase() && p.user_id === userId);
      if (exists) {
        return res.status(400).json({ success: false, message: 'A platform with this name already exists' });
      }

      const newPlatform = {
        id: Date.now(),
        user_id: userId,
        name: cleanName,
        type,
        website: website.trim(),
        account_identifier: account_identifier.trim(),
        notes: notes.trim(),
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.platforms.push(newPlatform);
      return res.status(201).json({ success: true, data: newPlatform });
    }

    const result = await query(
      `INSERT INTO platforms (user_id, name, type, website, account_identifier, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, cleanName, type, website.trim() || null, account_identifier.trim() || null, notes.trim() || null]
    );

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePlatform = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;
    const { name, type, website, account_identifier, notes } = req.body;

    if (isMockMode()) {
      const idx = mockData.platforms.findIndex(p => String(p.id) === String(id) && p.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Platform not found or access denied' });

      const oldName = mockData.platforms[idx].name;
      const newName = name ? name.trim() : oldName;

      mockData.platforms[idx] = {
        ...mockData.platforms[idx],
        name: newName,
        type: type || mockData.platforms[idx].type,
        website: website !== undefined ? website.trim() : mockData.platforms[idx].website,
        account_identifier: account_identifier !== undefined ? account_identifier.trim() : mockData.platforms[idx].account_identifier,
        notes: notes !== undefined ? notes.trim() : mockData.platforms[idx].notes,
        updated_at: new Date()
      };

      // Cascade name rename to domains and hostings if name changed
      if (oldName !== newName) {
        mockData.domains.forEach(d => {
          if (d.user_id === userId) {
            if (d.account_label === oldName) d.account_label = newName;
            if (d.registrar === oldName) d.registrar = newName;
          }
        });
        mockData.hostings.forEach(h => {
          if (h.user_id === userId && h.provider === oldName) h.provider = newName;
        });
      }

      return res.json({ success: true, data: mockData.platforms[idx] });
    }

    await query(
      `UPDATE platforms SET name = ?, type = ?, website = ?, account_identifier = ?, notes = ? WHERE id = ? AND user_id = ?`,
      [name.trim(), type, website || null, account_identifier || null, notes || null, id, userId]
    );

    res.json({ success: true, message: 'Platform updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deletePlatform = async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user.user_id)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id || req.user.user_id;
    const { id } = req.params;

    if (isMockMode()) {
      const idx = mockData.platforms.findIndex(p => String(p.id) === String(id) && p.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Platform not found or access denied' });
      mockData.platforms.splice(idx, 1);
      return res.json({ success: true, message: 'Platform deleted' });
    }

    await query(`DELETE FROM platforms WHERE id = ? AND user_id = ?`, [id, userId]);
    res.json({ success: true, message: 'Platform deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
