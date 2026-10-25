import React, { useState } from 'react';
import {
  Tag, Plus, Search, ExternalLink, Globe, Server, Edit3, Trash2,
  CheckCircle2, Building, ShieldCheck
} from 'lucide-react';

export default function PlatformsView({
  platforms,
  loading,
  onOpenAddModal,
  onOpenEditModal,
  onDeletePlatform
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = platforms.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.website && p.website.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.account_identifier && p.account_identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Tag className="w-6 h-6 text-blue-600" />
            <span>Platforms & Provider Accounts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your registrar accounts and hosting platforms (Namecheap, Hostinger, HostGator, GoDaddy, etc.).
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Platform</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search platforms by name, website, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
      </div>

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">No Platforms Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add a new provider or adjust your search filter.
            </p>
          </div>
        ) : (
          filtered.map(p => {
            const isBoth = p.type === 'both';
            const isReg = p.type === 'registrar';
            const isHost = p.type === 'hosting';

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {isBoth ? 'Domains & Hosting' : isReg ? 'Domain Registrar' : 'Hosting Provider'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onOpenEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Edit Platform"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePlatform(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Platform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Identifier & Website */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    {p.account_identifier && (
                      <div className="flex items-center space-x-2 text-slate-600 font-mono text-[11px]">
                        <span className="text-slate-400">Login:</span>
                        <span>{p.account_identifier}</span>
                      </div>
                    )}

                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:underline text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{p.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}

                    {p.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-1">
                        {p.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Counts Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1 text-blue-600 font-semibold">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{p.total_domains || 0} Domains</span>
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                      <Server className="w-3.5 h-3.5" />
                      <span>{p.total_hostings || 0} Hostings</span>
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium text-[11px]">
                    Total: {p.total_assets || 0}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
