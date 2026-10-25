import React, { useState, useEffect } from 'react';
import { X, Globe, DollarSign, Calendar, User, Tag, FileText, Layers } from 'lucide-react';

export default function DomainModal({ isOpen, onClose, onSave, domain = null, clients = [], platforms = [], hostings = [] }) {
  const [formData, setFormData] = useState({
    domain_name: '',
    account_label: 'Namecheap Account 1',
    client_id: '',
    linked_hosting_id: '',
    registrar: 'Namecheap',
    registration_date: '',
    expiry_date: '',
    cost_price: '13.99',
    client_price: '25.00',
    auto_renew: 0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (domain) {
      setFormData({
        domain_name: domain.domain_name || '',
        account_label: domain.account_label || (platforms[0]?.name || 'Namecheap Account 1'),
        client_id: domain.client_id || '',
        linked_hosting_id: domain.linked_hosting_id || '',
        registrar: domain.registrar || 'Namecheap',
        registration_date: domain.registration_date ? domain.registration_date.split('T')[0] : '',
        expiry_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
        cost_price: domain.cost_price !== undefined ? String(domain.cost_price) : '13.99',
        client_price: domain.client_price !== undefined ? String(domain.client_price) : '25.00',
        auto_renew: domain.auto_renew ? 1 : 0,
        notes: domain.notes || ''
      });
    } else {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const defaultPlatform = platforms.length > 0 ? platforms[0].name : 'Namecheap Account 1';

      setFormData({
        domain_name: '',
        account_label: defaultPlatform,
        client_id: '',
        linked_hosting_id: '',
        registrar: defaultPlatform,
        registration_date: new Date().toISOString().split('T')[0],
        expiry_date: oneYearFromNow.toISOString().split('T')[0],
        cost_price: '13.99',
        client_price: '25.00',
        auto_renew: 0,
        notes: ''
      });
    }
    setError('');
  }, [domain, isOpen, platforms]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.domain_name.trim()) {
      setError('Domain name is required');
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
        is_bundle: formData.linked_hosting_id ? 1 : 0
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save domain');
    } finally {
      setLoading(false);
    }
  };

  // Filter hostings by client if selected
  const availableHostings = formData.client_id
    ? hostings.filter(h => String(h.client_id) === String(formData.client_id))
    : hostings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {domain ? 'Edit Domain' : 'Add New Domain'}
              </h3>
              <p className="text-xs text-slate-500">
                Track expiry and link to platform account & client
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Domain Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Domain Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="example.com"
                value={formData.domain_name}
                onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Platform / Account & Client Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Platform / Provider Account <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={formData.account_label}
                  onChange={(e) => setFormData({ ...formData, account_label: e.target.value, registrar: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
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
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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

          {/* Link with Hosting Package (Bundle combo support) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Link with Hosting Package (Optional Combo Bundle)</span>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                Combo Feature
              </span>
            </label>
            <div className="relative">
              <Layers className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <select
                value={formData.linked_hosting_id}
                onChange={(e) => setFormData({ ...formData, linked_hosting_id: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                <option value="">-- Standalone Domain (No Linked Hosting) --</option>
                {availableHostings.map(h => (
                  <option key={h.id} value={h.id}>
                    📦 {h.package_name} ({h.primary_domain || h.server_name}) - Client: {h.client_name || 'Unassigned'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registration Date & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Registration Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
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
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Pricing: Cost vs Client Price */}
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
                  placeholder="13.99"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                  placeholder="25.00"
                  value={formData.client_price}
                  onChange={(e) => setFormData({ ...formData, client_price: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold text-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Auto Renew & Notes */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="auto_renew"
              checked={Boolean(formData.auto_renew)}
              onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="auto_renew" className="text-xs font-medium text-slate-700">
              Auto-renew enabled at registrar portal
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Client & Renewal Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows="2"
                placeholder="E.g., Client requested renewal invoice via email..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : domain ? 'Update Domain' : 'Create Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
