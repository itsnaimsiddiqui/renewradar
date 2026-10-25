import React, { useState, useEffect } from 'react';
import {
  Send, Bot, BellRing, MessageSquare, CheckCircle2, AlertTriangle,
  Play, RefreshCw, Shield, Sparkles, Terminal, Copy, Key, Hash,
  Clock, Check, ExternalLink, HelpCircle, Save, Sliders, ListFilter
} from 'lucide-react';
import { api } from '../api';

const PRESET_TIERS = [60, 45, 30, 15, 7, 3, 1, 0];

export default function TelegramView({
  telegramStatus,
  logs,
  onRefresh,
  onSendTest,
  onTriggerCheck
}) {
  const [activeSubTab, setActiveSubTab] = useState('settings'); // 'settings', 'guide', 'commands', 'logs'

  // Settings form state
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [selectedTiers, setSelectedTiers] = useState([30, 15, 7, 3, 1, 0]);
  const [customDays, setCustomDays] = useState('');
  const [cronTime, setCronTime] = useState('09:00');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Test & Scan state
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notificationResult, setNotificationResult] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Load existing settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getTelegramSettings();
      if (res.success && res.data) {
        setBotToken(res.data.bot_token || '');
        setChatId(res.data.chat_id || '');
        setCronTime(res.data.cron_time || '09:00');
        if (res.data.alert_days) {
          const parsed = res.data.alert_days
            .split(',')
            .map(n => parseInt(n.trim(), 10))
            .filter(n => !isNaN(n));
          setSelectedTiers(parsed);
          setCustomDays(res.data.alert_days);
        }
      }
    } catch (err) {
      console.error('Error loading telegram settings:', err);
    }
  };

  const handleTierToggle = (tier) => {
    let updated;
    if (selectedTiers.includes(tier)) {
      updated = selectedTiers.filter(t => t !== tier);
    } else {
      updated = [...selectedTiers, tier].sort((a, b) => b - a);
    }
    setSelectedTiers(updated);
    setCustomDays(updated.join(', '));
  };

  const handleCustomDaysChange = (val) => {
    setCustomDays(val);
    const parsed = val
      .split(',')
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n));
    setSelectedTiers(parsed);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess('');

      const cleanDays = selectedTiers.length > 0 ? selectedTiers.join(',') : customDays || '30,15,7,3,1,0';

      const res = await api.updateTelegramSettings({
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        alert_days: cleanDays,
        cron_time: cronTime.trim()
      });

      if (res.success) {
        setSettingsSuccess(res.message || '✅ Settings saved and Telegram Bot connected!');
        if (onRefresh) onRefresh();
        setTimeout(() => setSettingsSuccess(''), 5000);
      } else {
        alert(`Error: ${res.message}`);
      }
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      setSendingTest(true);
      setNotificationResult('');
      const res = await onSendTest(testMessage);
      if (res.success) {
        setNotificationResult('✅ Test alert dispatched to your Telegram chat successfully!');
        setTestMessage('');
      } else {
        setNotificationResult(`❌ Error: ${res.message}`);
      }
    } catch (err) {
      setNotificationResult(`❌ Failed: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const handleScanClick = async () => {
    try {
      setScanning(true);
      setNotificationResult('');
      const res = await onTriggerCheck();
      setNotificationResult(`✅ ${res.message}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setNotificationResult(`❌ Failed to scan: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const isActive = telegramStatus?.is_active;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <span>Telegram Bot & Expiry Radar</span>
                {isActive ? (
                  <span className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Live & Connected</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
                    <span>Awaiting Token</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated 24/7 client expiry alerts and interactive natural language assistant for domains, hostings & bundles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleScanClick}
            disabled={scanning}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Trigger Expiry Scan Now'}</span>
          </button>
        </div>
      </div>

      {notificationResult && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          notificationResult.startsWith('✅')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {notificationResult}
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'settings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Bot Credentials & Alert Schedule</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'guide'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Step-by-Step Bot Setup Guide</span>
        </button>

        <button
          onClick={() => setActiveSubTab('commands')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'commands'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Q&A Questions Cheat Sheet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Notification Logs ({logs?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: BOT SETTINGS & NOTIFICATION SCHEDULE */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Credentials & Notification Schedule Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Configure Telegram Bot Credentials & Notification Days</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your Telegram credentials here. The system will immediately connect to your bot without requiring a server reboot!
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Credentials Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Telegram Bot Token</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('guide')}
                      className="text-[11px] text-blue-600 hover:underline font-normal"
                    >
                      Where to get?
                    </button>
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 123456789:ABCdefGHIjklMNOpqr..."
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Provided by @BotFather upon bot creation.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-600" />
                      <span>Telegram Chat / User ID</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('guide')}
                      className="text-[11px] text-blue-600 hover:underline font-normal"
                    >
                      How to find?
                    </button>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Your numeric ID from @userinfobot where alerts will arrive.
                  </span>
                </div>
              </div>

              {/* Notification Days Selection */}
              <div className="pt-3 border-t border-slate-100">
                <div className="mb-2.5">
                  <label className="block text-xs font-bold text-slate-800">
                    📅 When should Telegram alerts be sent before expiry?
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Click the day badges below to toggle notification tiers, or customize with custom numbers:
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESET_TIERS.map((tier) => {
                    const isSelected = selectedTiers.includes(tier);
                    return (
                      <button
                        type="button"
                        key={tier}
                        onClick={() => handleTierToggle(tier)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                          isSelected
                            ? tier <= 3
                              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                              : 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{tier === 0 ? 'Day 0 (Expiry Day)' : `${tier} Days Before`}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Custom comma-separated days:
                  </label>
                  <input
                    type="text"
                    value={customDays}
                    onChange={(e) => handleCustomDaysChange(e.target.value)}
                    placeholder="e.g. 60, 45, 30, 15, 7, 3, 1, 0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Daily Cron Time */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daily Automated Check Time (Server Time)</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="time"
                    value={cronTime}
                    onChange={(e) => setCronTime(e.target.value)}
                    className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                  <span className="text-[11px] text-slate-500">
                    The radar will automatically check for expiries and dispatch alerts every day at this time.
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Settings are saved permanently to database and applied in real time.
                </span>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingSettings ? 'Connecting & Saving...' : 'Save & Connect Bot'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Test Alert Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Send Test Notification</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Dispatch an immediate test message to verify that your Bot Token and Chat ID are communicating.
              </p>

              <form onSubmit={handleTestSubmit} className="space-y-3">
                <textarea
                  rows="3"
                  placeholder="Type a custom message or leave blank for default radar test alert..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingTest ? 'Sending...' : 'Dispatch Test Alert'}</span>
                </button>
              </form>
            </div>

            {/* Quick Status Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Active Radar Configuration
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">Bot Status:</span>
                  <span className={isActive ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {isActive ? "Active & Polling" : "Offline / Unset"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">Scheduled Check:</span>
                  <span className="font-semibold text-slate-200">{cronTime} Daily</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">Alert Tiers:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedTiers.length > 0 ? selectedTiers.join(', ') + ' Days' : 'Default'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Target Chat:</span>
                  <span className="font-mono text-slate-300">
                    {chatId ? `${chatId.slice(0, 3)}***${chatId.slice(-3)}` : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STEP-BY-STEP BOT SETUP GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Easy 3-Minute Setup</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              How to Create Your Telegram Bot & Get Credentials
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Follow this step-by-step beginner guide. You don’t need any coding knowledge — Telegram’s official BotFather does everything for you in seconds!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group hover:border-blue-300 transition">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <h4 className="text-sm font-bold text-slate-900">Open Telegram & Talk to @BotFather</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                BotFather is Telegram’s official tool for creating and managing bots. Click the button below to open it directly:
              </p>
              <div className="pt-1">
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <span>Open @BotFather in Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group hover:border-blue-300 transition">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <h4 className="text-sm font-bold text-slate-900">Create a New Bot (/newbot)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send the command <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">/newbot</code> to BotFather:
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-mono">
                <div>1. Send: <strong>/newbot</strong></div>
                <div>2. Enter bot name: e.g. <strong>My Agency Radar</strong></div>
                <div>3. Enter username ending in <i>bot</i>: e.g. <strong>my_agency_radar_bot</strong></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group hover:border-blue-300 transition">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <h4 className="text-sm font-bold text-slate-900">Copy HTTP API Token</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                BotFather will congratulate you and show your HTTP API token:
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono break-all">
                Use this token to access the HTTP API:
                <div className="mt-1 font-bold text-slate-900">123456789:ABCdefGhIJKlmNoPQRstuVWxYz</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Copy this entire string and paste it into the <strong>Telegram Bot Token</strong> input field in the Settings tab!
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group hover:border-blue-300 transition">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <h4 className="text-sm font-bold text-slate-900">Find Your Telegram Chat ID</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                To receive alerts, the bot needs your numeric personal ID or channel ID.
              </p>
              <div className="space-y-2">
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <span>Open @userinfobot</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-slate-500">
                  Simply send <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">/start</code> to @userinfobot. It replies with your <strong>Id: 123456789</strong>. Copy this number and paste into the <strong>Chat ID</strong> field!
                </p>
              </div>
            </div>
          </div>

          {/* Action prompt */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="text-xs text-blue-900">
              <strong>Ready to connect?</strong> Once you have both values, head over to the Credentials tab to save!
            </div>
            <button
              onClick={() => setActiveSubTab('settings')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Go to Credentials &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ENGLISH QUESTIONS & COMMANDS CHEAT SHEET */}
      {activeSubTab === 'commands' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>Interactive English Q&A & Command Cheat Sheet</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your Telegram bot understands natural English questions! Click any phrase to copy it, then paste it directly into your Telegram bot chat:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                q: "Which domains are expired?",
                desc: "Returns all expired domains & combo bundles with client name & click-to-call phone number."
              },
              {
                q: "Which hosting expired?",
                desc: "Returns all expired hosting packages with platform name & client details."
              },
              {
                q: "Who should I call today?",
                desc: "Instant priority call list of clients whose domains/hostings expire within 7 days."
              },
              {
                q: "What is expiring soon?",
                desc: "Summary of assets expiring within the next 30 days."
              },
              {
                q: "/status",
                desc: "Executive overview showing total domains, hosting packages, bundles, and counts."
              },
              {
                q: "/expired",
                desc: "Instant list of all expired assets across all registrars and servers."
              },
              {
                q: "/call_list",
                desc: "Immediate phone directory of clients with critical/expired services."
              },
              {
                q: "/client Skyline",
                desc: "Search client and list all domains & hostings belonging to them."
              },
              {
                q: "/check",
                desc: "Manually triggers an automated expiry scan and sends alerts right now."
              }
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => copyToClipboard(item.q, i)}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs font-mono text-indigo-900 group-hover:text-indigo-600">
                    &ldquo;{item.q}&rdquo;
                  </span>
                  {copiedIndex === i ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATION LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dispatched Notification Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit log of all alerts sent by automated cron or manual triggers.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {logs?.length || 0} Total Dispatched
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition text-xs flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold uppercase text-[10px]">
                        {log.type}
                      </span>
                      <span className="font-bold text-slate-900">{log.item_title}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">
                        {log.days_remaining <= 0 ? (
                          <span className="text-rose-600 font-bold">Expired</span>
                        ) : (
                          `${log.days_remaining} Days Left`
                        )}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-line">
                      {log.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-slate-400 block">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                    <span className="inline-block mt-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No notification logs recorded yet. Once alerts are dispatched, they will appear here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
