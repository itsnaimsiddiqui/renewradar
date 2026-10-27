import React, { useState } from 'react';
import {
  Server, Search, Plus, Filter, Calendar, DollarSign, User, Phone,
  Globe, HardDrive, Edit3, Trash2, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';

export default function HostingsView({
  hostings,
  platforms = [],
  loading,
  onOpenAddModal,
  onOpenBundleModal,
  onOpenEditModal,
  onRenewHosting,
  onDeleteHosting
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredHostings = hostings.filter(h => {
    const matchesSearch =
      h.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.primary_domain && h.primary_domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.client_name && h.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.provider && h.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.server_name && h.server_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.client_phone && h.client_phone.includes(searchTerm));

    const matchesProvider = selectedProvider === 'all' || h.provider === selectedProvider;

    let matchesStatus = true;
    if (selectedStatus === 'expired') {
      matchesStatus = h.days_remaining < 0;
    } else if (selectedStatus === 'critical_7') {
      matchesStatus = h.days_remaining >= 0 && h.days_remaining <= 7;
    } else if (selectedStatus === 'expiring_30') {
      matchesStatus = h.days_remaining >= 0 && h.days_remaining <= 30;
    } else if (selectedStatus === 'active') {
      matchesStatus = h.days_remaining > 30;
    }

    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Server className="w-6 h-6 text-emerald-600" />
            <span>Client Hosting Packages</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tracking hosting packages across Namecheap, Hostinger, HostGator, and server infrastructure.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenBundleModal}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition flex items-center space-x-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>+ Combo Bundle</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hosting</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search package name, domain, client, provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Platform Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
          >
            <option value="all">All Providers</option>
            {platforms.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {/* Expiry Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
          >
            <option value="all">All Expiry Statuses</option>
            <option value="critical_7">Critical (&le; 7 Days)</option>
            <option value="expiring_30">Expiring (&le; 30 Days)</option>
            <option value="expired">Expired Only</option>
            <option value="active">Active (&gt; 30 Days)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredHostings.length === 0 ? (
          <div className="p-12 text-center">
            <Server className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">No Hosting Packages Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Package & Domain</th>
                  <th className="py-3 px-4 whitespace-nowrap">Provider & Server</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assigned Client</th>
                  <th className="py-3 px-4 whitespace-nowrap">Expiry & Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Billing & Fee</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredHostings.map(h => {
                  const days = h.days_remaining;
                  const isExpired = days < 0;
                  const isCritical = days >= 0 && days <= 7;
                  const isWarning = days > 7 && days <= 30;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/60 transition group">
                      {/* Package & Domain */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 whitespace-nowrap">
                          <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="whitespace-nowrap">{h.package_name}</span>
                          {h.is_bundle && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded whitespace-nowrap">
                              Combo
                            </span>
                          )}
                        </div>
                        {h.primary_domain && (
                          <div className="flex items-center space-x-1 text-[11px] text-blue-600 font-medium mt-0.5 whitespace-nowrap">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="whitespace-nowrap">{h.primary_domain}</span>
                          </div>
                        )}
                        {h.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1 max-w-xs whitespace-normal">
                            {h.notes}
                          </p>
                        )}
                      </td>

                      {/* Provider & Server */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block whitespace-nowrap">
                          {h.provider || 'Platform'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                          {h.server_name || 'Server'} &bull; {h.ip_address || ''}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {h.client_name ? (
                          <div>
                            <div className="font-semibold text-slate-800 whitespace-nowrap">{h.client_name}</div>
                            {h.client_phone && (
                              <a
                                href={`tel:${h.client_phone}`}
                                className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium hover:underline mt-0.5 whitespace-nowrap"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">{h.client_phone}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic whitespace-nowrap">Unassigned</span>
                        )}
                      </td>

                      {/* Expiry & Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          {isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap">
                              EXPIRED ({Math.abs(days)}d ago)
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                              {days} Days Left (Call!)
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 whitespace-nowrap">
                              {days} Days Left
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
                              {days} Days (Safe)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block whitespace-nowrap">
                          Expires: {h.expiry_date ? h.expiry_date.split('T')[0] : 'N/A'}
                        </span>
                      </td>

                      {/* Billing & Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-900 font-bold whitespace-nowrap">${h.client_price || '0.00'}</div>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                          <span className="capitalize">{h.billing_cycle || 'annual'}</span>
                          <span>&bull;</span>
                          <span>Cost: ${h.cost_price || '0.00'}</span>
                        </div>
                      </td>

                      {/* Actions (Sticky Right) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 transition shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10">
                        <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onRenewHosting(h.id)}
                            title="Quick Renew +1 Year"
                            className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition whitespace-nowrap shadow-xs"
                          >
                            +1yr
                          </button>
                          <button
                            onClick={() => onOpenEditModal(h)}
                            title="Edit Hosting"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition shrink-0"
                          >
                            <Edit3 className="w-4 h-4 shrink-0" />
                          </button>
                          <button
                            onClick={() => onDeleteHosting(h.id)}
                            title="Delete Hosting"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
