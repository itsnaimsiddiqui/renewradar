import React, { useState } from 'react';
import {
  Globe, Search, Plus, Filter, Calendar, DollarSign, User, Phone,
  RefreshCw, Edit3, Trash2, CheckCircle2, AlertCircle, Clock, Layers
} from 'lucide-react';

export default function DomainsView({
  domains,
  platforms = [],
  loading,
  onOpenAddModal,
  onOpenBundleModal,
  onOpenEditModal,
  onRenewDomain,
  onDeleteDomain
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredDomains = domains.filter(d => {
    const matchesSearch =
      d.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.client_name && d.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.client_phone && d.client_phone.includes(searchTerm)) ||
      (d.account_label && d.account_label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAccount = selectedAccount === 'all' || d.account_label === selectedAccount || d.registrar === selectedAccount;

    let matchesStatus = true;
    if (selectedStatus === 'expired') {
      matchesStatus = d.days_remaining < 0;
    } else if (selectedStatus === 'critical_7') {
      matchesStatus = d.days_remaining >= 0 && d.days_remaining <= 7;
    } else if (selectedStatus === 'expiring_30') {
      matchesStatus = d.days_remaining >= 0 && d.days_remaining <= 30;
    } else if (selectedStatus === 'active') {
      matchesStatus = d.days_remaining > 30;
    }

    return matchesSearch && matchesAccount && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Globe className="w-6 h-6 text-blue-600" />
            <span>Domain Portfolio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tracking domains across Namecheap, Hostinger, HostGator, and other connected platforms.
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
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Dynamic Platform Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setSelectedAccount('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedAccount === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Platforms ({domains.length})
        </button>

        {platforms.map(p => {
          const count = domains.filter(d => d.account_label === p.name || d.registrar === p.name).length;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedAccount(p.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedAccount === p.name
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search domain, client name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
          >
            <option value="all">All Expiry Statuses</option>
            <option value="critical_7">Critical (&le; 7 Days)</option>
            <option value="expiring_30">Expiring (&le; 30 Days)</option>
            <option value="expired">Expired Only</option>
            <option value="active">Active (&gt; 30 Days)</option>
          </select>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredDomains.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">No Domains Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Domain & Platform</th>
                  <th className="py-3 px-5">Assigned Client</th>
                  <th className="py-3 px-5">Expiry Date</th>
                  <th className="py-3 px-5">Urgency Badge</th>
                  <th className="py-3 px-5">Pricing (Cost / Fee)</th>
                  <th className="py-3 px-5">Auto-Renew</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDomains.map(d => {
                  const days = d.days_remaining;
                  const isExpired = days < 0;
                  const isCritical = days >= 0 && days <= 7;
                  const isWarning = days > 7 && days <= 30;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition">
                      {/* Domain & Platform */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span>{d.domain_name}</span>
                          {d.is_bundle && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              Combo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {d.account_label || d.registrar || 'Platform'}
                          </span>
                          {d.linked_hosting_name && (
                            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Layers className="w-3 h-3" />
                              <span>{d.linked_hosting_name}</span>
                            </span>
                          )}
                        </div>
                        {d.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1 max-w-xs">
                            {d.notes}
                          </p>
                        )}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-5">
                        {d.client_name ? (
                          <div>
                            <div className="font-semibold text-slate-800">{d.client_name}</div>
                            {d.client_phone && (
                              <a
                                href={`tel:${d.client_phone}`}
                                className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium hover:underline mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{d.client_phone}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-800 block">
                          {d.expiry_date ? d.expiry_date.split('T')[0] : 'N/A'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Registered: {d.registration_date ? d.registration_date.split('T')[0] : 'N/A'}
                        </span>
                      </td>

                      {/* Urgency Badge */}
                      <td className="py-3.5 px-5">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            EXPIRED ({Math.abs(days)}d ago)
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {days} Days Left (Call!)
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            {days} Days Left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            {days} Days (Safe)
                          </span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-5">
                        <div className="text-slate-900 font-bold">${d.client_price || '0.00'}</div>
                        <span className="text-[11px] text-slate-400">
                          Cost: ${d.cost_price || '0.00'}
                        </span>
                      </td>

                      {/* Auto Renew */}
                      <td className="py-3.5 px-5">
                        {d.auto_renew ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ON</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Manual</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onRenewDomain(d.id)}
                            title="Quick Renew +1 Year"
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition"
                          >
                            +1yr
                          </button>
                          <button
                            onClick={() => onOpenEditModal(d)}
                            title="Edit Domain"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDomain(d.id)}
                            title="Delete Domain"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
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
