const cron = require('node-cron');
const { query, isMockMode, mockData, getAppSetting, setAppSetting } = require('../config/db');
const { sendExpiryAlert, getDaysRemaining } = require('./telegramBot');

let cronJob = null;

// Default reminder tiers: 30, 15, 7, 3, 1, 0
const DEFAULT_TIERS = [30, 15, 7, 3, 1, 0];

async function getActiveTiers() {
  const custom = await getAppSetting('alert_days');
  if (custom && custom.trim()) {
    const parsed = custom.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
    if (parsed.length > 0) return parsed;
  }
  return DEFAULT_TIERS;
}

async function runExpiryCheck() {
  console.log('⏰ [Reminder Cron] Starting expiry check cycle...');

  let checkedCount = 0;
  let alertsSent = 0;

  try {
    // 1. Fetch domains
    let domains = [];
    let hostings = [];

    if (isMockMode()) {
      domains = mockData.domains;
      hostings = mockData.hostings;
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
    }

    checkedCount = domains.length + hostings.length;
    const activeTiers = await getActiveTiers();

    // Check Domains
    for (const d of domains) {
      const daysLeft = getDaysRemaining(d.expiry_date);

      // Status auto-correction
      let calculatedStatus = d.status;
      if (daysLeft < 0) calculatedStatus = 'expired';
      else if (daysLeft <= 30) calculatedStatus = 'expiring_soon';
      else calculatedStatus = 'active';

      // Check if daysLeft matches any tier and hasn't been sent yet
      const shouldAlert = activeTiers.includes(daysLeft) && d.last_notified_tier !== daysLeft;

      if (shouldAlert) {
        const sent = await sendExpiryAlert({
          type: 'domain',
          name: d.domain_name,
          clientName: d.client_name,
          clientPhone: d.client_phone,
          expiryDate: d.expiry_date,
          daysLeft,
          renewalPrice: d.client_price,
          accountLabel: d.account_label
        });

        if (sent) {
          alertsSent++;
          await logNotification('domain', d.id, d.domain_name, daysLeft, `Sent ${daysLeft}-day reminder for ${d.domain_name}`);

          // Update last_notified_tier & status
          d.last_notified_tier = daysLeft;
          d.status = calculatedStatus;

          if (!isMockMode()) {
            await query(
              `UPDATE domains SET last_notified_tier = ?, status = ? WHERE id = ?`,
              [daysLeft, calculatedStatus, d.id]
            );
          }
        }
      }
    }

    // Check Hostings
    for (const h of hostings) {
      const daysLeft = getDaysRemaining(h.expiry_date);

      let calculatedStatus = h.status;
      if (daysLeft < 0) calculatedStatus = 'expired';
      else if (daysLeft <= 30) calculatedStatus = 'expiring_soon';
      else calculatedStatus = 'active';

      const shouldAlert = activeTiers.includes(daysLeft) && h.last_notified_tier !== daysLeft;

      if (shouldAlert) {
        const sent = await sendExpiryAlert({
          type: 'hosting',
          name: `${h.package_name}${h.primary_domain ? ` (${h.primary_domain})` : ''}`,
          clientName: h.client_name,
          clientPhone: h.client_phone,
          expiryDate: h.expiry_date,
          daysLeft,
          renewalPrice: h.client_price,
          accountLabel: `Server: ${h.server_name || 's12018'}`
        });

        if (sent) {
          alertsSent++;
          await logNotification('hosting', h.id, h.package_name, daysLeft, `Sent ${daysLeft}-day reminder for ${h.package_name}`);

          h.last_notified_tier = daysLeft;
          h.status = calculatedStatus;

          if (!isMockMode()) {
            await query(
              `UPDATE hostings SET last_notified_tier = ?, status = ? WHERE id = ?`,
              [daysLeft, calculatedStatus, h.id]
            );
          }
        }
      }
    }

    console.log(`✅ [Reminder Cron] Expiry check complete: ${checkedCount} checked, ${alertsSent} alerts sent.`);
    return { checkedCount, alertsSent, timestamp: new Date() };
  } catch (err) {
    console.error('❌ [Reminder Cron] Error during expiry check:', err.message);
    return { checkedCount, alertsSent, error: err.message };
  }
}

// Log notification entry
async function logNotification(type, referenceId, itemTitle, daysRemaining, message) {
  const logEntry = {
    id: Date.now(),
    type,
    reference_id: referenceId,
    item_title: itemTitle,
    days_remaining: daysRemaining,
    message,
    status: 'sent',
    created_at: new Date().toISOString()
  };

  if (isMockMode()) {
    mockData.notifications.unshift(logEntry);
  } else {
    try {
      await query(
        `INSERT INTO notification_logs (type, reference_id, item_title, days_remaining, message, status) VALUES (?, ?, ?, ?, ?, 'sent')`,
        [type, referenceId, itemTitle, daysRemaining, message]
      );
    } catch (err) {
      console.error('Error logging notification to DB:', err.message);
    }
  }
}

// Start or update Scheduled Job
async function initReminderCron(customCronTime) {
  let cronTime = customCronTime;
  if (!cronTime) {
    cronTime = await getAppSetting('cron_time', '09:00');
  }

  let cronExpression = process.env.ALERT_CRON || process.env.CRON_SCHEDULE;
  if (!cronExpression || customCronTime) {
    // Convert HH:MM to cron expression
    if (cronTime && cronTime.includes(':')) {
      const [h, m] = cronTime.split(':');
      cronExpression = `${parseInt(m, 10) || 0} ${parseInt(h, 10) || 9} * * *`;
    } else {
      cronExpression = '0 9 * * *';
    }
  }

  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }

  if (cron.validate(cronExpression)) {
    cronJob = cron.schedule(cronExpression, async () => {
      console.log(`⏰ [Cron Trigger] Executing scheduled daily expiry scan at ${new Date().toISOString()}`);
      await runExpiryCheck();
    });
    console.log(`⏰ [Reminder Cron] Scheduled daily check with cron: "${cronExpression}"`);
    return true;
  } else {
    console.error(`❌ [Reminder Cron] Invalid cron expression: "${cronExpression}"`);
    return false;
  }
}

async function rescheduleCron(cronTime) {
  if (cronTime) {
    await setAppSetting('cron_time', cronTime.trim());
  }
  return await initReminderCron(cronTime);
}

module.exports = {
  initReminderCron,
  rescheduleCron,
  getActiveTiers,
  runExpiryCheck,
  logNotification
};
