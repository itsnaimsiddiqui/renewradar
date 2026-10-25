import React, { useState, useEffect } from 'react';
import { X, Server, DollarSign, Calendar, User, Globe, HardDrive, FileText, Tag, Layers } from 'lucide-react';

export default function HostingModal({ isOpen, onClose, onSave, hosting = null, clients = [], platforms = [], domains = [] }) {
  const [formData, setFormData] = useState({
    package_name: '20GB Pro cPanel Package',
    client_id: '',
    linked_domain_id: '',
    provider: 'Namecheap Account 1',
    server_name: 's12018',
    ip_address: '209.42.27.76',
    primary_domain: '',
    start_date: '',
    expiry_date: '',
    billing_cycle: 'annual',
    cost_price: '45.00',
    client_price: '90.00',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hosting) {
      setFormData({
        package_name: hosting.package_name || '',
        client_id: hosting.client_id || '',
        linked_domain_id: hosting.linked_domain_id || '',
        provider: hosting.provider || (platforms[0]?.name || 'Namecheap Account 1'),
        server_name: hosting.server_name || 's12018',
        ip_address: hosting.ip_address || '209.42.27.76',
        primary_domain: hosting.primary_domain || '',
        start_date: hosting.start_date ? hosting.start_date.split('T')[0] : '',
        expiry_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
        billing_cycle: hosting.billing_cycle || 'annual',
        cost_price: hosting.cost_price !== undefined ? String(hosting.cost_price) : '45.00',
        client_price: hosting.client_price !== undefined ? String(hosting.client_price) : '90.00',
        notes: hosting.notes || ''
      });
    } else {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const defaultPlatform = platforms.length > 0 ? platforms[0].name : 'Namecheap Account 1';

      setFormData({
        package_name: '20GB Pro cPanel Package',
        client_id: '',
        linked_domain_id: '',
        provider: defaultPlatform,
        server_name: 's12018',
        ip_address: '209.42.27.76',
        primary_domain: '',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: oneYearFromNow.toISOString().split('T')[0],
        billing_cycle: 'annual',
        cost_price: '45.00',
        client_price: '90.00',
        notes: ''
      });
    }
    setError('');
  }, [hosting, isOpen, platforms]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.package_name.trim()) {
      setError('Package name is required');
      return;
    }
    if (!formData.expiry_date) {
      setError('Expiry date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        ...formData,
        is_bundle: formData.linked_domain_id ? 1 : 0
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save hosting package');
    } finally {
      setLoading(false);
    }
  };

  const availableDomains = formData.client_id
    ? domains.filter(d => String(d.client_id) === String(formData.client_id))
    : domains;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {hosting ? 'Edit Hosting Package' : 'Add New Hosting Package'}
              </h3>
              <p className="text-xs text-slate-500">
                Track cPanel package, server parameters, and expiry date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Package Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Package Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <HardDrive className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="20GB Pro cPanel Package"
                value={formData.package_name}
                onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
              />
            </div>
          </div>

          {/* Provider Platform & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Hosting Provider Platform <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
                >
                  {platforms.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  {platforms.length === 0 && (
                    <>
                      <option value="Namecheap Account 1">Namecheap Account 1</option>
                      <option value="Namecheap Account 2">Namecheap Account 2</option>
                      <option value="Hostinger">Hostinger</option>
                      <option value="HostGator">HostGator</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Assigned Client
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                >
                  <option value="">-- Unassigned / Internal --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Primary Domain & Link with Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Primary Domain URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="clientdomain.com"
                  value={formData.primary_domain}
                  onChange={(e) => setFormData({ ...formData, primary_domain: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Link Domain (Combo)</span>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">Bundle</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={formData.linked_domain_id}
                  onChange={(e) => setFormData({ ...formData, linked_domain_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                >
                  <option value="">-- No Linked Domain --</option>
                  {availableDomains.map(d => (
                    <option key={d.id} value={d.id}>
                      🌐 {d.domain_name} ({d.account_label || 'Platform'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Server Name & IP Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Server Name
              </label>
              <div className="relative">
                <Server className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="s12018"
                  value={formData.server_name}
                  onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Server IP
              </label>
              <input
                type="text"
                placeholder="209.42.27.76"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Billing Cycle & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Billing Cycle
              </label>
              <select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                <option value="annual">Annual (1 Year)</option>
                <option value="semi_annual">Semi-Annual (6 Months)</option>
                <option value="quarterly">Quarterly (3 Months)</option>
                <option value="monthly">Monthly</option>
                <option value="biennial">Biennial (2 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Our Cost Price ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="45.00"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Client Renewal Fee ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="90.00"
                  value={formData.client_price}
                  onChange={(e) => setFormData({ ...formData, client_price: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Hosting & Client Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows="2"
                placeholder="E.g., Includes free SSL certificate and 10 email accounts..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : hosting ? 'Update Hosting' : 'Create Hosting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
