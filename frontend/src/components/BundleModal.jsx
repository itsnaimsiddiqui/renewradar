import React, { useState, useEffect } from 'react';
import { X, Layers, Globe, Server, DollarSign, Calendar, User, Tag, FileText } from 'lucide-react';

export default function BundleModal({ isOpen, onClose, onSave, clients = [], platforms = [] }) {
  const [formData, setFormData] = useState({
    client_id: '',
    domain_name: '',
    package_name: 'Business cPanel Package',
    platform: 'Namecheap Account 1',
    registration_date: '',
    expiry_date: '',
    server_name: 's12018',
    ip_address: '209.42.27.76',
    domain_cost: '13.99',
    domain_price: '25.00',
    hosting_cost: '45.00',
    hosting_price: '90.00',
    billing_cycle: 'annual',
    auto_renew: 0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const defaultPlatform = platforms.length > 0 ? platforms[0].name : 'Namecheap Account 1';

      setFormData({
        client_id: '',
        domain_name: '',
        package_name: 'Business cPanel Package',
        platform: defaultPlatform,
        registration_date: new Date().toISOString().split('T')[0],
        expiry_date: oneYearFromNow.toISOString().split('T')[0],
        server_name: 's12018',
        ip_address: '209.42.27.76',
        domain_cost: '13.99',
        domain_price: '25.00',
        hosting_cost: '45.00',
        hosting_price: '90.00',
        billing_cycle: 'annual',
        auto_renew: 0,
        notes: ''
      });
      setError('');
    }
  }, [isOpen, platforms]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.domain_name.trim()) {
      setError('Domain name is required');
      return;
    }
    if (!formData.package_name.trim()) {
      setError('Hosting package name is required');
      return;
    }
    if (!formData.expiry_date) {
      setError('Shared expiry date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create combo bundle');
    } finally {
      setLoading(false);
    }
  };

  const totalClientPrice = (parseFloat(formData.domain_price || 0) + parseFloat(formData.hosting_price || 0)).toFixed(2);
  const totalCost = (parseFloat(formData.domain_cost || 0) + parseFloat(formData.hosting_cost || 0)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                New Combo Bundle (Domain + Hosting)
              </h3>
              <p className="text-xs text-slate-500">
                Purchased together for a client from Namecheap, Hostinger, or any provider
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Client & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Platform / Provider Account <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
          </div>

          {/* Domain & Hosting details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Domain Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="clientdomain.com"
                  value={formData.domain_name}
                  onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Hosting Package Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Server className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="20GB Pro cPanel"
                  value={formData.package_name}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Purchase / Registration Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Shared Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Server & IP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Server Name
              </label>
              <input
                type="text"
                placeholder="s12018"
                value={formData.server_name}
                onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
                className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
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
                className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Financial Breakdown</span>
              <span className="text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Total Client Bill: ${totalClientPrice}
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Domain Cost</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.domain_cost}
                  onChange={(e) => setFormData({ ...formData, domain_cost: e.target.value })}
                  className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg mt-1 font-medium"
                />
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Domain Client Fee</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.domain_price}
                  onChange={(e) => setFormData({ ...formData, domain_price: e.target.value })}
                  className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg mt-1 font-medium text-blue-700"
                />
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hosting Cost</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hosting_cost}
                  onChange={(e) => setFormData({ ...formData, hosting_cost: e.target.value })}
                  className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg mt-1 font-medium"
                />
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hosting Client Fee</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hosting_price}
                  onChange={(e) => setFormData({ ...formData, hosting_price: e.target.value })}
                  className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg mt-1 font-medium text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Bundle Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows="2"
                placeholder="E.g., Client renewed both together with business email setup..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {loading ? 'Creating Combo...' : 'Create Combo Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
