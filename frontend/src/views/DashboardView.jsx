import React from 'react';
import {
  Globe, Server, Users, AlertTriangle, AlertCircle, Phone, ArrowUpRight,
  TrendingUp, RefreshCw, CheckCircle, ShieldAlert, Sparkles, Layers, Tag
} from 'lucide-react';

export default function DashboardView({
  summary,
  loading,
  onRefresh,
  onOpenBundleModal,
  onOpenDomainModal,
  onOpenHostingModal,
  onRenewDomain,
  onRenewHosting,
  onRenewBundle,
  onNavigateTab
}) {
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-500 font-medium">Loading Radar Intelligence...</span>
      </div>
    );
  }

  const counts = summary?.counts || {};
  const financials = summary?.financials || {};
  const urgentCalls = summary?.urgent_calls || [];
  const assetsByPlatform = summary?.assets_by_platform || {};
  const recentLogs = summary?.recent_notifications || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Alert if any item is expired or expiring in <= 7 days */}
      {(counts.expired_total > 0 || counts.expiring_7_days > 0) && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Action Required: {counts.expired_total} Expired & {counts.expiring_7_days} Critical Expiries!
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Review the Call List below and phone clients before their services disconnect or domain grace periods expire.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const element = document.getElementById('urgent-call-center');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0"
          >
            <span>Jump to Call List</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Domains */}
        <div
          onClick={() => onNavigateTab('domains')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Domains</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{counts.total_domains || 0}</span>
            <span className="text-xs text-slate-500">Across All Platforms</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Platforms: <strong>{counts.total_platforms || 0}</strong></span>
            <span className="text-blue-600 font-medium">View Portfolio &rarr;</span>
          </div>
        </div>

        {/* Total Hostings */}
        <div
          onClick={() => onNavigateTab('hostings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hosting Packages</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{counts.total_hostings || 0}</span>
            <span className="text-xs text-slate-500">Client Servers</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Monitored 24/7</span>
            <span className="text-emerald-600 font-medium">View Servers &rarr;</span>
          </div>
        </div>

        {/* Expiring Soon (30d) */}
        <div
          onClick={() => onNavigateTab('domains')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expiring in 30 Days</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-600">{counts.expiring_30_days || 0}</span>
            <span className="text-xs text-slate-500">Upcoming Alerts</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="text-amber-700 font-medium">{counts.expiring_7_days || 0} in critical tier (&le;7d)</span>
            <span className="text-slate-400">Telegram alert sent</span>
          </div>
        </div>

        {/* Expired Assets */}
        <div
          onClick={() => onNavigateTab('domains')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Currently Expired</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-rose-600">{counts.expired_total || 0}</span>
            <span className="text-xs text-slate-500">Grace Period</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Domains: <strong>{counts.expired_domains || 0}</strong></span>
            <span>Hostings: <strong>{counts.expired_hostings || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Dynamic Platforms Distribution & Financial Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Platforms Distribution Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Platform Distribution</span>
            </h3>
            <button
              onClick={() => onNavigateTab('platforms')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Manage &rarr;
            </button>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {Object.entries(assetsByPlatform).map(([name, data]) => (
              <div key={name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">{name}</span>
                  <span className="text-[11px] text-slate-400">
                    {data.domains} Domains &bull; {data.hostings} Hostings
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {data.total} Assets
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Flow Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Annual Renewal Pipeline</span>
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Profit Margin
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-500">Client Revenue (Billable):</span>
              <span className="font-bold text-slate-900 text-sm">${financials.total_client_revenue || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-500">Registrar & Server Cost:</span>
              <span className="font-semibold text-slate-600 text-sm">${financials.total_cost_price || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2.5 bg-emerald-50/60 px-3 rounded-xl border border-emerald-100">
              <span className="font-semibold text-emerald-800">Estimated Gross Margin:</span>
              <span className="font-bold text-emerald-700 text-base">+${financials.net_profit || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Telegram Bot Automation Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Telegram Alert Bot</span>
              </h3>
              <span className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Active 24/7</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Automated reminders fire at <strong>30, 15, 7, 3, and 1 day</strong> before expiry. The bot answers English questions like:
            </p>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-mono text-slate-700 space-y-1">
              <div>&ldquo;Which domains are expired?&rdquo;</div>
              <div>&ldquo;Who should I call today?&rdquo;</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('telegram')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>Bot Settings & Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* URGENT CLIENT CALL LIST */}
      <div id="urgent-call-center" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Urgent Client Call Center (Today's Call Priority)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Items expired or expiring within 7 days. Click the phone number to call immediately from your device.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenBundleModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center space-x-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Combo Bundle</span>
            </button>
            <button
              onClick={onOpenDomainModal}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              + Domain
            </button>
            <button
              onClick={onOpenHostingModal}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
            >
              + Hosting
            </button>
          </div>
        </div>

        {urgentCalls.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No Urgent Calls Needed!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All client assets have more than 7 days remaining before renewal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Urgency & Expiry</th>
                  <th className="py-3 px-4 whitespace-nowrap">Item & Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Client & Contact</th>
                  <th className="py-3 px-4 whitespace-nowrap">Renewal Fee</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                    Quick Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {urgentCalls.map((item) => {
                  const isExpired = item.days_remaining < 0;
                  const isToday = item.days_remaining === 0;

                  return (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/60 transition group">
                      {/* Urgency Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap">
                            EXPIRED ({Math.abs(item.days_remaining)}d ago)
                          </span>
                        ) : isToday ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse whitespace-nowrap">
                            EXPIRES TODAY!
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            {item.days_remaining} Days Left
                          </span>
                        )}
                        <span className="block text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                          {item.expiry_date ? item.expiry_date.split('T')[0] : 'N/A'}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-sm flex items-center space-x-1.5 whitespace-nowrap">
                          {item.is_bundle ? (
                            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : item.type === 'domain' ? (
                            <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <Server className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          <span className="whitespace-nowrap">{item.title}</span>
                          {item.is_bundle && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded whitespace-nowrap">
                              Combo
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {item.account || 'Platform'}
                        </span>
                      </td>

                      {/* Client & Phone */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-sm whitespace-nowrap">{item.client_name}</div>
                        {item.client_phone ? (
                          <a
                            href={`tel:${item.client_phone}`}
                            className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-semibold hover:underline mt-0.5 whitespace-nowrap"
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{item.client_phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic whitespace-nowrap">No phone</span>
                        )}
                      </td>

                      {/* Fee */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        ${item.renewal_price || '0.00'}
                      </td>

                      {/* Action (Sticky Right) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 transition shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10">
                        {item.is_bundle ? (
                          <button
                            onClick={() => onRenewBundle({ domainId: item.id, hostingId: item.hosting_id, years: 1 })}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition whitespace-nowrap shadow-xs"
                          >
                            Renew Combo (+1yr)
                          </button>
                        ) : item.type === 'domain' ? (
                          <button
                            onClick={() => onRenewDomain(item.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition whitespace-nowrap shadow-xs"
                          >
                            Renew +1yr
                          </button>
                        ) : (
                          <button
                            onClick={() => onRenewHosting(item.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition whitespace-nowrap shadow-xs"
                          >
                            Renew +1yr
                          </button>
                        )}
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
