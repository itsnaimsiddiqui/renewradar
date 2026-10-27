import React from 'react';
import { X, RefreshCw, AlertTriangle, Layers, Globe, Server, Check } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  itemTitle = null,
  itemSubtitle = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'renewal', // 'renewal' | 'danger' | 'info'
  loading = false
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isRenewal = type === 'renewal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isDanger 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : isRenewal 
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              {isDanger ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isRenewal ? (
                <Layers className="w-5 h-5" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Details Box (if provided) */}
        {(itemTitle || itemSubtitle) && (
          <div className="mx-5 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              {itemTitle && (
                <div className="text-xs font-bold text-slate-800 truncate">
                  {itemTitle}
                </div>
              )}
              {itemSubtitle && (
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {itemSubtitle}
                </div>
              )}
            </div>
            {isRenewal && (
              <span className="shrink-0 text-[10px] font-bold text-indigo-700 bg-indigo-100/80 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                +1 Year
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition shadow-xs flex items-center space-x-1.5 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                : isRenewal 
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isRenewal ? (
              <Check className="w-3.5 h-3.5" />
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
