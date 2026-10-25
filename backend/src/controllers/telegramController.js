const {
  isBotActive,
  getBotInstance,
  sendDirectMessage,
  reloadTelegramBot,
  getConfiguredChatId,
  getConfiguredToken
} = require('../services/telegramBot');
const { runExpiryCheck, rescheduleCron, getActiveTiers } = require('../services/reminderCron');
const { isMockMode, mockData, query, getAppSetting, setAppSetting } = require('../config/db');

exports.getBotStatus = async (req, res) => {
  try {
    const rawChatId = await getConfiguredChatId();
    const rawToken = await getConfiguredToken();
    const hasToken = Boolean(rawToken && !rawToken.includes('YOUR_TELEGRAM'));
    const hasChatId = Boolean(rawChatId && !rawChatId.includes('YOUR_'));
    const alertDaysStr = await getAppSetting('alert_days', '30,15,7,3,1,0');
    const cronTime = await getAppSetting('cron_time', '09:00');
    const reminderTiers = await getActiveTiers();

    let recentLogs = [];
    if (isMockMode()) {
      recentLogs = mockData.notifications.slice(0, 20);
    } else {
      recentLogs = await query(`SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 20`);
    }

    res.json({
      success: true,
      data: {
        is_active: isBotActive(),
        configured: {
          token: hasToken,
          chat_id: hasChatId,
          masked_chat_id: hasChatId ? String(rawChatId).replace(/.(?=.{3})/g, '*') : null,
          masked_token: hasToken ? `${rawToken.slice(0, 5)}...${rawToken.slice(-4)}` : null,
          chat_id_value: rawChatId || '',
          token_value: hasToken ? rawToken : ''
        },
        alert_days_str: alertDaysStr,
        cron_time: cronTime,
        reminder_tiers: reminderTiers,
        recent_logs: recentLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const rawChatId = await getConfiguredChatId();
    const rawToken = await getConfiguredToken();
    const alertDaysStr = await getAppSetting('alert_days', '30,15,7,3,1,0');
    const cronTime = await getAppSetting('cron_time', '09:00');
    const reminderTiers = await getActiveTiers();

    res.json({
      success: true,
      data: {
        is_active: isBotActive(),
        bot_token: rawToken ? (rawToken.includes('YOUR_') ? '' : rawToken) : '',
        chat_id: rawChatId ? (rawChatId.includes('YOUR_') ? '' : rawChatId) : '',
        alert_days: alertDaysStr,
        cron_time: cronTime,
        reminder_tiers: reminderTiers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { bot_token, chat_id, alert_days, cron_time } = req.body;

    if (alert_days !== undefined) {
      await setAppSetting('alert_days', String(alert_days).trim());
    }

    if (cron_time !== undefined) {
      await setAppSetting('cron_time', String(cron_time).trim());
      await rescheduleCron(String(cron_time).trim());
    }

    let reloadResult = { success: true, message: 'Settings saved.' };
    if (bot_token !== undefined || chat_id !== undefined) {
      reloadResult = await reloadTelegramBot(bot_token, chat_id);
    }

    res.json({
      success: true,
      message: reloadResult.message || 'Telegram Bot settings updated successfully!',
      is_active: isBotActive()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendTestMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const targetChatId = chatId || (await getConfiguredChatId());

    const textToSend = message || `
🔔 *RenewRadar - Telegram Test Notification*
━━━━━━━━━━━━━━━━━━
This is a test notification from your Domain & Hosting Expiry Radar!

✅ Telegram Bot connected successfully.
📅 Current Server Time: ${new Date().toLocaleString()}
🎯 Automated daily reminders are active!
`;

    const result = await sendDirectMessage(targetChatId, textToSend);

    if (result.success) {
      const logEntry = {
        id: Date.now(),
        type: 'manual',
        reference_id: null,
        item_title: 'Manual Test Message',
        days_remaining: 0,
        message: 'Manual test alert dispatched from web dashboard',
        status: 'sent',
        created_at: new Date().toISOString()
      };

      if (isMockMode()) {
        mockData.notifications.unshift(logEntry);
      } else {
        await query(
          `INSERT INTO notification_logs (type, item_title, days_remaining, message, status) VALUES ('manual', 'Manual Test Message', 0, ?, 'sent')`,
          [textToSend]
        );
      }

      return res.json({ success: true, message: 'Test message sent to Telegram successfully!' });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || result.error || 'Failed to send message. Make sure Bot Token and Chat ID are configured.'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.triggerExpiryCheck = async (req, res) => {
  try {
    const result = await runExpiryCheck();
    res.json({
      success: true,
      message: `Expiry scan completed. Scanned ${result.checkedCount} items, sent ${result.alertsSent} notification(s).`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getNotificationLogs = async (req, res) => {
  try {
    let logs = [];
    if (isMockMode()) {
      logs = mockData.notifications;
    } else {
      logs = await query(`SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 50`);
    }

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
