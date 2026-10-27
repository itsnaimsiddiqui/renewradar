const { Bot } = require('grammy');
const { isMockMode, mockData, query, getAppSetting, setAppSetting } = require('../config/db');

let botInstance = null;
let isBotActive = false;

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

// Calculate days remaining helper
function getDaysRemaining(expiryDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to fetch data
async function getAllData() {
  if (isMockMode()) {
    return {
      domains: mockData.domains,
      hostings: mockData.hostings,
      clients: mockData.clients,
      platforms: mockData.platforms
    };
  }

  try {
    const domains = await query(`
      SELECT d.*, c.name as client_name, c.phone as client_phone, c.company as client_company
      FROM domains d
      LEFT JOIN clients c ON d.client_id = c.id
      ORDER BY d.expiry_date ASC
    `);

    const hostings = await query(`
      SELECT h.*, c.name as client_name, c.phone as client_phone, c.company as client_company
      FROM hostings h
      LEFT JOIN clients c ON h.client_id = c.id
      ORDER BY h.expiry_date ASC
    `);

    const clients = await query(`SELECT * FROM clients ORDER BY name ASC`);
    const platforms = await query(`SELECT * FROM platforms ORDER BY name ASC`);

    return { domains, hostings, clients, platforms };
  } catch (err) {
    console.error('Error fetching data for telegram bot:', err.message);
    return {
      domains: mockData.domains,
      hostings: mockData.hostings,
      clients: mockData.clients,
      platforms: mockData.platforms
    };
  }
}

async function getConfiguredChatId() {
  const fromDb = await getAppSetting('telegram_chat_id');
  if (fromDb && fromDb.trim() && !fromDb.includes('YOUR_')) return fromDb.trim();
  const envId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CEO_CHAT_ID;
  if (envId && envId.trim() && !envId.includes('YOUR_')) return envId.trim();
  return null;
}

async function getConfiguredToken() {
  const fromDb = await getAppSetting('telegram_bot_token');
  if (fromDb && fromDb.trim() && !fromDb.includes('YOUR_')) return fromDb.trim();
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  if (envToken && envToken.trim() && !envToken.includes('YOUR_')) return envToken.trim();
  return null;
}

// Initialize Telegram Bot
async function initTelegramBot(tokenOverride) {
  const token = tokenOverride || (await getConfiguredToken());
  if (!token || token.trim() === '' || token.includes('YOUR_TELEGRAM')) {
    console.log('ℹ️ [Telegram Bot] Token is not configured yet. Bot polling is paused until TELEGRAM_BOT_TOKEN is set.');
    isBotActive = false;
    return null;
  }

  try {
    if (botInstance) {
      try {
        await botInstance.stop();
      } catch (stopErr) {
        // ignore
      }
      botInstance = null;
    }

    const bot = new Bot(token.trim());
    registerBotHandlers(bot);

    // Start background polling without blocking
    bot.start({
      onStart: (botInfo) => {
        isBotActive = true;
        console.log(`🤖 [Telegram Bot] Bot @${botInfo.username} initialized and polling for commands.`);
      }
    }).catch(err => {
      console.warn(`⚠️ [Telegram Bot] Polling stopped or network error: ${err.message}`);
      isBotActive = false;
    });

    botInstance = bot;
    isBotActive = true;
    return bot;
  } catch (err) {
    console.error('❌ [Telegram Bot] Error initializing bot:', err.message);
    isBotActive = false;
    botInstance = null;
    return null;
  }
}

// Dynamically reload Telegram Bot with new credentials from UI
async function reloadTelegramBot(token, chatId) {
  if (token && token.trim()) {
    await setAppSetting('telegram_bot_token', token.trim());
  }
  if (chatId && chatId.trim()) {
    await setAppSetting('telegram_chat_id', chatId.trim());
  }

  const activeToken = token ? token.trim() : (await getConfiguredToken());
  if (!activeToken) {
    if (botInstance) {
      try { await botInstance.stop(); } catch (e) {}
      botInstance = null;
    }
    isBotActive = false;
    return { success: false, message: 'Bot token cannot be empty.' };
  }

  const instance = await initTelegramBot(activeToken);
  if (!instance) {
    return { success: false, message: 'Failed to start bot. Check your bot token from @BotFather.' };
  }

  // Send test confirmation if chat ID exists
  const activeChatId = chatId ? chatId.trim() : (await getConfiguredChatId());
  if (activeChatId) {
    try {
      await instance.api.sendMessage(
        activeChatId,
        `🎉 *RenewRadar Connected!* \n━━━━━━━━━━━━━━━━━━\nYour Telegram Bot is now active and monitoring all domains & hostings.`,
        { parse_mode: 'Markdown' }
      );
    } catch (msgErr) {
      console.warn('Could not send confirmation to chat:', msgErr.message);
    }
  }

  return { success: true, message: 'Telegram Bot connected & activated successfully!' };
}

// Register Handlers & Intelligent Natural Language Answers
function registerBotHandlers(bot) {
  // 1. /start and /help command
  bot.command(['start', 'help'], async (ctx) => {
    const chatId = ctx.chat.id;
    const welcome = `
👋 *Welcome to RenewRadar Bot!*
I monitor all your domains, hosting packages, and client combo bundles across Namecheap, Hostinger, HostGator, and other platforms.

*Quick Commands:*
• \`/status\` - Executive overview of all assets
• \`/expired\` - List all expired domains, hostings & bundles
• \`/expiring\` - Assets expiring in 30 days
• \`/call_list\` - Clients who urgently need a renewal call
• \`/client <name>\` - Check assets for a specific client
• \`/check\` - Run automatic expiry scan right now

💬 *You can also ask me directly in English:*
• _"Which domains are expired?"_
• _"Which hosting expired?"_
• _"What is expiring soon?"_
• _"Who should I call today?"_
• _"Give me a summary"_

Your Chat ID is: \`${chatId}\`
`;
    await ctx.reply(welcome, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '📊 Overview Status' }, { text: '🚨 Expired List' }],
          [{ text: '⚠️ Expiring in 30 Days' }, { text: '📞 Who to Call Today?' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });
  });

  // 2. /status or "status" / "overview" / "summary"
  bot.command(['status', 'overview', 'summary'], async (ctx) => {
    await handleStatus(ctx.chat.id);
  });

  // 3. /expired command
  bot.command('expired', async (ctx) => {
    await handleExpired(ctx.chat.id);
  });

  // 4. /expiring command
  bot.command('expiring', async (ctx) => {
    await handleExpiring(ctx.chat.id);
  });

  // 5. /call_list or who to call
  bot.command(['call_list', 'calls'], async (ctx) => {
    await handleCallList(ctx.chat.id);
  });

  // 6. /client <name>
  bot.command('client', async (ctx) => {
    const clientQuery = (ctx.match || '').trim();
    if (!clientQuery) {
      return ctx.reply('Usage: `/client <name>` (e.g. `/client Tanvir`)', { parse_mode: 'Markdown' });
    }
    await handleClientSearch(ctx.chat.id, clientQuery);
  });

  // 7. /check - manual run
  bot.command('check', async (ctx) => {
    const chatId = ctx.chat.id;
    await ctx.reply('🔍 Scanning all domains, hostings, and bundles for upcoming expiries...');
    const reminderCron = require('./reminderCron');
    const result = await reminderCron.runExpiryCheck();
    await ctx.reply(`✅ Scan complete. Processed ${result.checkedCount} items. ${result.alertsSent} notification(s) dispatched.`);
  });

  // 8. Natural Language Handler
  bot.on('message:text', async (ctx) => {
    const text = (ctx.message.text || '').trim().toLowerCase();
    if (text.startsWith('/')) return;

    const chatId = ctx.chat.id;

    if (text.includes('overview') || text === 'status' || text.includes('summary') || text.includes('how many')) {
      return await handleStatus(chatId);
    }

    if (
      (text.includes('which domain') && text.includes('expire')) ||
      text.includes('expired domain') ||
      text === '🚨 expired list' ||
      text === 'expired' ||
      text.includes('what domains are expired')
    ) {
      return await handleExpired(chatId, 'domains');
    }

    if (
      (text.includes('which hosting') && text.includes('expire')) ||
      text.includes('expired hosting')
    ) {
      return await handleExpired(chatId, 'hostings');
    }

    if (
      text.includes('expiring') ||
      text.includes('expire soon') ||
      text === '⚠️ expiring in 30 days' ||
      text.includes('upcoming expiry')
    ) {
      return await handleExpiring(chatId);
    }

    if (
      text.includes('who should i call') ||
      text.includes('who to call') ||
      text.includes('call list') ||
      text === '📞 who to call today?'
    ) {
      return await handleCallList(chatId);
    }

    await ctx.reply(
      `I can help you with domain & hosting tracking. Try asking:\n` +
      `• _"Which domains are expired?"_\n` +
      `• _"Which hosting expired?"_\n` +
      `• _"What is expiring soon?"_\n` +
      `• _"Who should I call today?"_\n` +
      `Or use /status, /expired, /expiring.`,
      { parse_mode: 'Markdown' }
    );
  });
}

// Handler implementations
async function handleStatus(chatId) {
  if (!botInstance) return;
  const { domains, hostings, clients, platforms } = await getAllData();

  let expiredDomains = 0;
  let expiringDomains30 = 0;
  let expiringDomains7 = 0;
  let bundleCount = 0;

  domains.forEach(d => {
    const days = getDaysRemaining(d.expiry_date);
    if (d.is_bundle) bundleCount++;
    if (days <= 0) expiredDomains++;
    else if (days <= 7) expiringDomains7++;
    else if (days <= 30) expiringDomains30++;
  });

  let expiredHostings = 0;
  let expiringHostings30 = 0;
  let expiringHostings7 = 0;

  hostings.forEach(h => {
    const days = getDaysRemaining(h.expiry_date);
    if (days <= 0) expiredHostings++;
    else if (days <= 7) expiringHostings7++;
    else if (days <= 30) expiringHostings30++;
  });

  const msg = `
📊 *RenewRadar - Portfolio Status*

🌐 *Domains:*
• Total: *${domains.length}*
• 🔴 Expired: *${expiredDomains}*
• 🟠 Expiring in 7 Days: *${expiringDomains7}*
• 🟡 Expiring in 30 Days: *${expiringDomains30}*

🖥️ *Hosting Packages:*
• Total: *${hostings.length}*
• 🔴 Expired: *${expiredHostings}*
• 🟠 Expiring in 7 Days: *${expiringHostings7}*
• 🟡 Expiring in 30 Days: *${expiringHostings30}*

📦 *Combo Bundles (Domain + Hosting):* *${bundleCount}*
🏢 *Connected Platforms:* *${platforms.length}* (Namecheap, Hostinger, etc.)
👥 *Clients Tracked:* *${clients.length}*

💡 _Tip: Type "Who should I call today?" for direct client phone numbers._
`;
  await botInstance.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

async function handleExpired(chatId, filterType = 'all') {
  if (!botInstance) return;
  const { domains, hostings } = await getAllData();

  const expiredD = domains.filter(d => getDaysRemaining(d.expiry_date) <= 0);
  const expiredH = hostings.filter(h => getDaysRemaining(h.expiry_date) <= 0);

  let response = '';

  if (filterType === 'all' || filterType === 'domains') {
    response += `🔴 *Expired Domains (${expiredD.length}):*\n`;
    if (expiredD.length === 0) {
      response += `_None! All domains are currently active._\n\n`;
    } else {
      expiredD.forEach((d, idx) => {
        const daysAgo = Math.abs(getDaysRemaining(d.expiry_date));
        const bundleTag = d.is_bundle ? ' 📦 [COMBO BUNDLE]' : '';
        response += `\n*${idx + 1}. ${d.domain_name}*${bundleTag}\n`;
        response += `   • Expired: *${formatDate(d.expiry_date)}* (${daysAgo} day${daysAgo === 1 ? '' : 's'} ago)\n`;
        response += `   • Platform: ${d.account_label || d.registrar || 'Namecheap'}\n`;
        response += `   • Client: *${d.client_name || 'Unassigned'}*\n`;
        response += `   • 📞 Phone: \`${d.client_phone || 'No phone'}\`\n`;
      });
      response += `\n`;
    }
  }

  if (filterType === 'all' || filterType === 'hostings') {
    response += `🔴 *Expired Hosting Packages (${expiredH.length}):*\n`;
    if (expiredH.length === 0) {
      response += `_None! All hosting packages are currently active._\n`;
    } else {
      expiredH.forEach((h, idx) => {
        const daysAgo = Math.abs(getDaysRemaining(h.expiry_date));
        const bundleTag = h.is_bundle ? ' 📦 [COMBO BUNDLE]' : '';
        response += `\n*${idx + 1}. ${h.package_name}*${bundleTag}\n`;
        response += `   • Primary Domain: ${h.primary_domain || 'N/A'}\n`;
        response += `   • Expired: *${formatDate(h.expiry_date)}* (${daysAgo} day${daysAgo === 1 ? '' : 's'} ago)\n`;
        response += `   • Provider: ${h.provider || 'Hosting'}\n`;
        response += `   • Client: *${h.client_name || 'Unassigned'}*\n`;
        response += `   • 📞 Phone: \`${h.client_phone || 'No phone'}\`\n`;
      });
    }
  }

  await botInstance.api.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

async function handleExpiring(chatId) {
  if (!botInstance) return;
  const { domains, hostings } = await getAllData();

  const expiringD = domains
    .map(d => ({ ...d, days: getDaysRemaining(d.expiry_date) }))
    .filter(d => d.days > 0 && d.days <= 30)
    .sort((a, b) => a.days - b.days);

  const expiringH = hostings
    .map(h => ({ ...h, days: getDaysRemaining(h.expiry_date) }))
    .filter(h => h.days > 0 && h.days <= 30)
    .sort((a, b) => a.days - b.days);

  let response = `⚠️ *Items Expiring Within 30 Days:*\n\n`;

  response += `🌐 *Domains (${expiringD.length}):*\n`;
  if (expiringD.length === 0) {
    response += `_No domains expiring in the next 30 days._\n\n`;
  } else {
    expiringD.forEach((d) => {
      const urgency = d.days <= 7 ? '🚨' : d.days <= 15 ? '🟠' : '🟡';
      const bundleTag = d.is_bundle ? ' 📦 [COMBO]' : '';
      response += `${urgency} *${d.domain_name}*${bundleTag} (${d.account_label || 'Platform'})\n`;
      response += `   • Expiry: *${formatDate(d.expiry_date)}* (*${d.days} days left*)\n`;
      response += `   • Client: *${d.client_name || 'N/A'}* | 📞 \`${d.client_phone || 'N/A'}\`\n`;
      response += `   • Renewal Fee: $${d.client_price || '0.00'}\n\n`;
    });
  }

  response += `🖥️ *Hosting Packages (${expiringH.length}):*\n`;
  if (expiringH.length === 0) {
    response += `_No hostings expiring in the next 30 days._\n`;
  } else {
    expiringH.forEach((h) => {
      const urgency = h.days <= 7 ? '🚨' : h.days <= 15 ? '🟠' : '🟡';
      const bundleTag = h.is_bundle ? ' 📦 [COMBO]' : '';
      response += `${urgency} *${h.package_name}*${bundleTag} (${h.provider || 'Hosting'})\n`;
      response += `   • Expiry: *${formatDate(h.expiry_date)}* (*${h.days} days left*)\n`;
      response += `   • Client: *${h.client_name || 'N/A'}* | 📞 \`${h.client_phone || 'N/A'}\`\n`;
      response += `   • Renewal Fee: $${h.client_price || '0.00'}\n\n`;
    });
  }

  await botInstance.api.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

async function handleCallList(chatId) {
  if (!botInstance) return;
  const { domains, hostings } = await getAllData();

  const urgentItems = [];
  const processedBundleDomainIds = new Set();

  // Check Bundles first
  domains.forEach(d => {
    const days = getDaysRemaining(d.expiry_date);
    if (days <= 7 && d.linked_hosting_id) {
      const linkedH = hostings.find(h => String(h.id) === String(d.linked_hosting_id));
      processedBundleDomainIds.add(d.id);
      urgentItems.push({
        type: 'Combo (Domain + Hosting)',
        title: `${d.domain_name} + ${linkedH ? linkedH.package_name : 'Hosting'}`,
        days,
        client: d.client_name || 'Unassigned',
        phone: d.client_phone || 'N/A',
        price: (parseFloat(d.client_price || 0) + parseFloat(linkedH ? linkedH.client_price || 0 : 0)).toFixed(2)
      });
    }
  });

  // Standalone domains
  domains.forEach(d => {
    const days = getDaysRemaining(d.expiry_date);
    if (days <= 7 && !processedBundleDomainIds.has(d.id)) {
      urgentItems.push({
        type: 'Domain',
        title: d.domain_name,
        days,
        client: d.client_name || 'Unassigned',
        phone: d.client_phone || 'N/A',
        price: d.client_price
      });
    }
  });

  // Standalone hostings
  hostings.forEach(h => {
    const days = getDaysRemaining(h.expiry_date);
    const isAlreadyInBundle = h.linked_domain_id && processedBundleDomainIds.has(h.linked_domain_id);
    if (days <= 7 && !isAlreadyInBundle) {
      urgentItems.push({
        type: 'Hosting',
        title: h.package_name + (h.primary_domain ? ` (${h.primary_domain})` : ''),
        days,
        client: h.client_name || 'Unassigned',
        phone: h.client_phone || 'N/A',
        price: h.client_price
      });
    }
  });

  urgentItems.sort((a, b) => a.days - b.days);

  let response = `📞 *Urgent Client Call List (Today's Priority)*\n`;
  response += `Call these clients now to confirm their renewals:\n\n`;

  if (urgentItems.length === 0) {
    response += `🎉 Great news! No clients need urgent renewal calls right now.`;
  } else {
    urgentItems.forEach((item, idx) => {
      const statusText = item.days < 0 ? `EXPIRED ${Math.abs(item.days)}d ago` : item.days === 0 ? `EXPIRES TODAY!` : `Expires in ${item.days}d`;
      response += `*${idx + 1}. ${item.client}*\n`;
      response += `   📱 Call: \`${item.phone}\`\n`;
      response += `   📦 ${item.type}: *${item.title}*\n`;
      response += `   ⏰ Status: *${statusText}*\n`;
      response += `   💰 Renewal: $${item.price || '0.00'}\n\n`;
    });
  }

  await botInstance.api.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

async function handleClientSearch(chatId, clientQuery) {
  if (!botInstance) return;
  const { domains, hostings, clients } = await getAllData();

  const foundClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(clientQuery.toLowerCase()))
  );

  if (foundClients.length === 0) {
    return await botInstance.api.sendMessage(chatId, `❌ No client found matching "${clientQuery}".`);
  }

  let response = `🔍 *Search Results for "${clientQuery}":*\n\n`;

  for (const c of foundClients) {
    const clientDomains = domains.filter(d => d.client_id === c.id || d.client_name === c.name);
    const clientHostings = hostings.filter(h => h.client_id === c.id || h.client_name === c.name);

    response += `👤 *Client: ${c.name}* (${c.company || 'Personal'})\n`;
    response += `📞 Phone: \`${c.phone}\` | ✉️ ${c.email || 'N/A'}\n`;
    response += `🌐 Domains (${clientDomains.length}): ${clientDomains.map(d => `${d.domain_name} [${formatDate(d.expiry_date)}]`).join(', ') || 'None'}\n`;
    response += `🖥️ Hostings (${clientHostings.length}): ${clientHostings.map(h => `${h.package_name} [${formatDate(h.expiry_date)}]`).join(', ') || 'None'}\n\n`;
  }

  await botInstance.api.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

// Proactive Expiry Alert Method
async function sendExpiryAlert({ type, name, clientName, clientPhone, expiryDate, daysLeft, renewalPrice, accountLabel }) {
  const chatId = await getConfiguredChatId();
  if (!botInstance || !chatId) {
    console.log(`[Telegram Alert Simulation] Would send alert for ${type} ${name} to Chat ID: ${chatId || 'NOT_SET'}`);
    return false;
  }

  let badge = '⚠️';
  let urgencyText = `Expires in ${daysLeft} Days`;

  if (daysLeft <= 0) {
    badge = '🚨 EXPIRED ALERT!';
    urgencyText = `EXPIRED ${Math.abs(daysLeft)} DAYS AGO`;
  } else if (daysLeft === 1) {
    badge = '🚨 CRITICAL (1 DAY LEFT)';
    urgencyText = `EXPIRES TOMORROW`;
  } else if (daysLeft <= 7) {
    badge = '🚨 URGENT (7 DAYS)';
  } else if (daysLeft <= 15) {
    badge = '🟠 UPCOMING (15 DAYS)';
  } else if (daysLeft <= 30) {
    badge = '🟡 NOTICE (30 DAYS)';
  }

  const typeLabel = type === 'bundle' ? '📦 Combo (Domain + Hosting)' : type === 'domain' ? '🌐 Domain' : '🖥️ Hosting';

  const message = `
${badge}
━━━━━━━━━━━━━━━━━━
📌 *Asset Type:* ${typeLabel}
🏷️ *Item:* *${name}*
${accountLabel ? `🏢 *Platform/Account:* ${accountLabel}\n` : ''}📅 *Expiry Date:* *${formatDate(expiryDate)}*
⏰ *Urgency:* *${urgencyText}*

👤 *Client Details:*
• Name: *${clientName || 'Unassigned'}*
• Phone: \`${clientPhone || 'No phone recorded'}\`
• Renewal Fee: *$${renewalPrice || '0.00'}*

👉 *Action Required:* Call client now to confirm renewal and prevent service disruption!
`;

  try {
    await botInstance.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (err) {
    console.error('Error sending proactive telegram message:', err.message);
    return false;
  }
}

// Send Direct Test Message
async function sendDirectMessage(targetChatId, text) {
  const id = targetChatId || (await getConfiguredChatId());
  if (!botInstance || !id) {
    return { success: false, message: 'Bot or Chat ID is not configured yet. Configure them in Settings.' };
  }

  try {
    await botInstance.api.sendMessage(id, text, { parse_mode: 'Markdown' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  initTelegramBot,
  reloadTelegramBot,
  getConfiguredChatId,
  getConfiguredToken,
  getBotInstance: () => botInstance,
  isBotActive: () => isBotActive,
  sendExpiryAlert,
  sendDirectMessage,
  getAllData,
  getDaysRemaining
};
