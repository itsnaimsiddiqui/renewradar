import React, { useState } from 'react';
import {
  Users, Search, Plus, Phone, Mail, Building, Globe, Server,
  ChevronDown, ChevronUp, Edit3, Trash2, Calendar, FileText
} from 'lucide-react';

export default function ClientsView({
  clients,
  loading,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteClient
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState(null);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleExpand = (id) => {
    setExpandedClientId(expandedClientId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Clients Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Clients associated with domains and hosting packages. Direct phone numbers for renewal alerts.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by client name, company, phone, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">No Clients Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add a client or adjust your search term.
            </p>
          </div>
        ) : (
          filteredClients.map(c => {
            const isExpanded = expandedClientId === c.id;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition overflow-hidden"
              >
                {/* Client Main Row */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">{c.name}</h3>
                        {c.company && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                            {c.company}
                          </span>
                        )}
                        {c.has_expired && (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
                            Has Expired Asset
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center space-x-1 text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2.5 py-0.5 rounded-lg whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{c.phone}</span>
                        </a>

                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{c.email}</span>
                          </a>
                        )}

                        <span className="text-slate-400">|</span>

                        <span className="text-slate-600">
                          <strong>{c.total_domains || 0}</strong> Domains &bull;{' '}
                          <strong>{c.total_hostings || 0}</strong> Hostings
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expand Button */}
                  <div className="flex items-center space-x-2 self-end md:self-auto">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide Assets' : 'View Assets'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onOpenEditModal(c)}
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                      title="Edit Client"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteClient(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Assets Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    {c.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <strong>Notes:</strong> {c.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Domains */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center space-x-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Domains Owned ({c.domains?.length || 0})</span>
                        </h4>
                        {c.domains?.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No domains assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {c.domains?.map(d => (
                              <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                                <span className="font-semibold text-slate-800">{d.domain_name}</span>
                                <span className="text-slate-500 font-mono">
                                  Expires: {d.expiry_date ? d.expiry_date.split('T')[0] : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Hostings */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center space-x-1.5">
                          <Server className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hosting Packages ({c.hostings?.length || 0})</span>
                        </h4>
                        {c.hostings?.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No hosting packages assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {c.hostings?.map(h => (
                              <div key={h.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                                <div>
                                  <span className="font-semibold text-slate-800 block">{h.package_name}</span>
                                  {h.primary_domain && <span className="text-[11px] text-blue-600">{h.primary_domain}</span>}
                                </div>
                                <span className="text-slate-500 font-mono">
                                  Expires: {h.expiry_date ? h.expiry_date.split('T')[0] : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
