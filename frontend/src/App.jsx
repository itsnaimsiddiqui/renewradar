import React, { useState, useEffect } from 'react';
import {
  Globe, Server, Users, Bot, LayoutDashboard, Shield, Plus,
  RefreshCw, CheckCircle2, AlertCircle, Layers, Tag, LogOut
} from 'lucide-react';
import { api } from './api';

import DashboardView from './views/DashboardView';
import DomainsView from './views/DomainsView';
import HostingsView from './views/HostingsView';
import ClientsView from './views/ClientsView';
import PlatformsView from './views/PlatformsView';
import TelegramView from './views/TelegramView';
import LoginView from './views/LoginView';

import DomainModal from './components/DomainModal';
import HostingModal from './components/HostingModal';
import ClientModal from './components/ClientModal';
import BundleModal from './components/BundleModal';
import PlatformModal from './components/PlatformModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [summary, setSummary] = useState(null);
  const [domains, setDomains] = useState([]);
  const [hostings, setHostings] = useState([]);
  const [clients, setClients] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [telegramLogs, setTelegramLogs] = useState([]);

  // Modal states
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const [hostingModalOpen, setHostingModalOpen] = useState(false);
  const [selectedHosting, setSelectedHosting] = useState(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [bundleModalOpen, setBundleModalOpen] = useState(false);

  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth unauthorized event listener
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Fetch all core datasets
  const fetchData = async () => {
    if (!api.isAuthenticated()) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [sumRes, domRes, hostRes, clientRes, platRes, telRes, logsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDomains(),
        api.getHostings(),
        api.getClients(),
        api.getPlatforms(),
        api.getTelegramStatus(),
        api.getTelegramLogs()
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (domRes.success) setDomains(domRes.data);
      if (hostRes.success) setHostings(hostRes.data);
      if (clientRes.success) setClients(clientRes.data);
      if (platRes.success) setPlatforms(platRes.data);
      if (telRes.success) setTelegramStatus(telRes.data);
      if (logsRes.success) setTelegramLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching radar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    showToast('Logged out successfully');
  };

  // --- Domain Actions ---
  const handleSaveDomain = async (formData) => {
    if (selectedDomain) {
      await api.updateDomain(selectedDomain.id, formData);
      showToast(`Domain ${formData.domain_name} updated successfully!`);
    } else {
      await api.createDomain(formData);
      showToast(`Domain ${formData.domain_name} added to portfolio!`);
    }
    await fetchData();
  };

  const handleRenewDomain = async (id) => {
    if (!window.confirm('Extend domain expiry by +1 year?')) return;
    try {
      await api.renewDomain(id, 1);
      showToast('Domain renewed +1 year!');
      await fetchData();
    } catch (err) {
      alert('Failed to renew domain: ' + err.message);
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;
    try {
      await api.deleteDomain(id);
      showToast('Domain deleted');
      await fetchData();
    } catch (err) {
      alert('Failed to delete domain: ' + err.message);
    }
  };

  // --- Hosting Actions ---
  const handleSaveHosting = async (formData) => {
    if (selectedHosting) {
      await api.updateHosting(selectedHosting.id, formData);
      showToast(`Hosting package updated!`);
    } else {
      await api.createHosting(formData);
      showToast(`Hosting package created!`);
    }
    await fetchData();
  };

  const handleRenewHosting = async (id) => {
    if (!window.confirm('Extend hosting package expiry by +1 year?')) return;
    try {
      await api.renewHosting(id, 12);
      showToast('Hosting renewed +1 year!');
      await fetchData();
    } catch (err) {
      alert('Failed to renew hosting: ' + err.message);
    }
  };

  const handleDeleteHosting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hosting package?')) return;
    try {
      await api.deleteHosting(id);
      showToast('Hosting package deleted');
      await fetchData();
    } catch (err) {
      alert('Failed to delete hosting: ' + err.message);
    }
  };

  // --- Client Actions ---
  const handleSaveClient = async (formData) => {
    if (selectedClient) {
      await api.updateClient(selectedClient.id, formData);
      showToast(`Client ${formData.name} updated!`);
    } else {
      await api.createClient(formData);
      showToast(`Client ${formData.name} created!`);
    }
    await fetchData();
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client? Associated domains/hostings will be unassigned.')) return;
    try {
      await api.deleteClient(id);
      showToast('Client deleted');
      await fetchData();
    } catch (err) {
      alert('Failed to delete client: ' + err.message);
    }
  };

  // --- Platform Actions ---
  const handleSavePlatform = async (formData) => {
    if (selectedPlatform) {
      await api.updatePlatform(selectedPlatform.id, formData);
      showToast(`Platform ${formData.name} updated!`);
    } else {
      await api.createPlatform(formData);
      showToast(`Platform ${formData.name} added!`);
    }
    await fetchData();
  };

  const handleDeletePlatform = async (id) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    try {
      await api.deletePlatform(id);
      showToast('Platform deleted');
      await fetchData();
    } catch (err) {
      alert('Failed to delete platform: ' + err.message);
    }
  };

  // --- Bundle Actions ---
  const handleCreateBundle = async (formData) => {
    const res = await api.createBundle(formData);
    if (res.success) {
      showToast('Combo Bundle (Domain + Hosting) created!');
      await fetchData();
    } else {
      throw new Error(res.message);
    }
  };

  const handleRenewBundle = async ({ domainId, hostingId, years = 1 }) => {
    if (!window.confirm(`Renew both Domain and Hosting together for +${years} year(s)?`)) return;
    try {
      const res = await api.renewBundle({ domainId, hostingId, years });
      if (res.success) {
        showToast('Combo Bundle renewed +1 year!');
        await fetchData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Failed to renew bundle: ' + err.message);
    }
  };

  // If not authenticated, render Login View
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          fetchData();
        }}
      />
    );
  }

  const urgentCount = (summary?.counts?.expired_total || 0) + (summary?.counts?.expiring_7_days || 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    <span className="text-blue-600">Renew</span>Radar
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                    v1.0 Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Domain & Hosting Radar</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('domains')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${activeTab === 'domains'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <Globe className="w-4 h-4" />
                <span>Domains</span>
                {urgentCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('hostings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${activeTab === 'hostings'
                  ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <Server className="w-4 h-4" />
                <span>Hosting</span>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${activeTab === 'clients'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Clients</span>
              </button>

              <button
                onClick={() => setActiveTab('platforms')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${activeTab === 'platforms'
                  ? 'bg-amber-50 text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <Tag className="w-4 h-4" />
                <span>Platforms</span>
              </button>

              <button
                onClick={() => setActiveTab('telegram')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${activeTab === 'telegram'
                  ? 'bg-purple-50 text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <Bot className="w-4 h-4" />
                <span>Telegram Bot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </button>
            </nav>

            {/* Top Right Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchData}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                title="Refresh All Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setBundleModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition shadow-xs flex items-center space-x-1"
                title="Add Domain & Hosting purchased together"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Combo Bundle</span>
              </button>

              <button
                onClick={() => {
                  setSelectedDomain(null);
                  setDomainModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Domain</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2 py-1 rounded-lg font-medium ${activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`px-2 py-1 rounded-lg font-medium ${activeTab === 'domains' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
            >
              Domains
            </button>
            <button
              onClick={() => setActiveTab('hostings')}
              className={`px-2 py-1 rounded-lg font-medium ${activeTab === 'hostings' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
            >
              Hosting
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-2 py-1 rounded-lg font-medium ${activeTab === 'clients' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab('platforms')}
              className={`px-2 py-1 rounded-lg font-medium ${activeTab === 'platforms' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
            >
              Platforms
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`px-2 py-1 rounded-lg font-medium ${activeTab === 'telegram' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
            >
              Telegram
            </button>
            <button
              onClick={handleLogout}
              className="px-2 py-1 rounded-lg font-medium text-rose-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            loading={loading}
            onRefresh={fetchData}
            onOpenBundleModal={() => setBundleModalOpen(true)}
            onOpenDomainModal={() => {
              setSelectedDomain(null);
              setDomainModalOpen(true);
            }}
            onOpenHostingModal={() => {
              setSelectedHosting(null);
              setHostingModalOpen(true);
            }}
            onRenewDomain={handleRenewDomain}
            onRenewHosting={handleRenewHosting}
            onRenewBundle={handleRenewBundle}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'domains' && (
          <DomainsView
            domains={domains}
            platforms={platforms}
            loading={loading}
            onOpenAddModal={() => {
              setSelectedDomain(null);
              setDomainModalOpen(true);
            }}
            onOpenBundleModal={() => setBundleModalOpen(true)}
            onOpenEditModal={(d) => {
              setSelectedDomain(d);
              setDomainModalOpen(true);
            }}
            onRenewDomain={handleRenewDomain}
            onDeleteDomain={handleDeleteDomain}
          />
        )}

        {activeTab === 'hostings' && (
          <HostingsView
            hostings={hostings}
            platforms={platforms}
            loading={loading}
            onOpenAddModal={() => {
              setSelectedHosting(null);
              setHostingModalOpen(true);
            }}
            onOpenBundleModal={() => setBundleModalOpen(true)}
            onOpenEditModal={(h) => {
              setSelectedHosting(h);
              setHostingModalOpen(true);
            }}
            onRenewHosting={handleRenewHosting}
            onDeleteHosting={handleDeleteHosting}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            loading={loading}
            onOpenAddModal={() => {
              setSelectedClient(null);
              setClientModalOpen(true);
            }}
            onOpenEditModal={(c) => {
              setSelectedClient(c);
              setClientModalOpen(true);
            }}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeTab === 'platforms' && (
          <PlatformsView
            platforms={platforms}
            loading={loading}
            onOpenAddModal={() => {
              setSelectedPlatform(null);
              setPlatformModalOpen(true);
            }}
            onOpenEditModal={(p) => {
              setSelectedPlatform(p);
              setPlatformModalOpen(true);
            }}
            onDeletePlatform={handleDeletePlatform}
          />
        )}

        {activeTab === 'telegram' && (
          <TelegramView
            telegramStatus={telegramStatus}
            logs={telegramLogs}
            onRefresh={fetchData}
            onSendTest={(msg) => api.sendTelegramTest(msg)}
            onTriggerCheck={() => api.triggerExpiryCheck()}
          />
        )}
      </main>

      {/* Clean Production Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} RenewRadar &bull; Multi-Provider Domain & Hosting Expiry Management System</span>
          <span>White-Label Ready &bull; SaaS Edition</span>
        </div>
      </footer>

      {/* Modals */}
      <DomainModal
        isOpen={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
        onSave={handleSaveDomain}
        domain={selectedDomain}
        clients={clients}
        platforms={platforms}
        hostings={hostings}
      />

      <HostingModal
        isOpen={hostingModalOpen}
        onClose={() => setHostingModalOpen(false)}
        onSave={handleSaveHosting}
        hosting={selectedHosting}
        clients={clients}
        platforms={platforms}
        domains={domains}
      />

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
      />

      <BundleModal
        isOpen={bundleModalOpen}
        onClose={() => setBundleModalOpen(false)}
        onSave={handleCreateBundle}
        clients={clients}
        platforms={platforms}
      />

      <PlatformModal
        isOpen={platformModalOpen}
        onClose={() => setPlatformModalOpen(false)}
        onSave={handleSavePlatform}
        platform={selectedPlatform}
      />
    </div>
  );
}
