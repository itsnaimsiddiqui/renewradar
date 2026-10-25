import React from 'react';
import { X, Server, Database, Terminal, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

export default function CpanelGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const htaccessCode = `# Apache 2.4 Reverse Proxy to Node.js App
DirectoryIndex disabled
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:5001/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5001/$1 [P,L]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                cPanel Deployment & MariaDB Setup Guide
              </h3>
              <p className="text-xs text-slate-500">
                Compatible with any cPanel hosting (Node 18.x - 22.x, MariaDB 10.4+ / MySQL 8.0+)
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
          {/* Quick Specs Badge */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 font-mono text-xs">
            <div>
              <span className="text-slate-400 block">Server OS:</span>
              <span className="font-semibold text-slate-800">Linux / cPanel</span>
            </div>
            <div>
              <span className="text-slate-400 block">Database:</span>
              <span className="font-semibold text-slate-800">MariaDB / MySQL</span>
            </div>
            <div>
              <span className="text-slate-400 block">Node.js:</span>
              <span className="font-semibold text-slate-800">20.x or 22.x</span>
            </div>
            <div>
              <span className="text-slate-400 block">Architecture:</span>
              <span className="font-semibold text-slate-800">Single Port</span>
            </div>
          </div>

          {/* Step 1: MariaDB */}
          <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h4>Step 1: Create Database & Import Schema in cPanel</h4>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 ml-1">
              <li>Log in to your cPanel dashboard.</li>
              <li>Go to <strong>MySQL® Databases</strong>. Create a new database, e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">yourprefix_radar</code>.</li>
              <li>Create or select a database user with <strong>ALL PRIVILEGES</strong> for this database.</li>
              <li>Open <strong>phpMyAdmin</strong> from cPanel, select your database, click <strong>Import</strong> and upload <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">backend/src/models/schema.sql</code>.</li>
            </ol>
          </div>

          {/* Step 2: Setup Node.js App */}
          <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <h4>Step 2: Configure "Setup Node.js App" in cPanel</h4>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 ml-1">
              <li>In cPanel, click on <strong>"Setup Node.js App"</strong>.</li>
              <li>Click <strong>Create Application</strong>:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-500">
                  <li><strong>Node.js Version:</strong> Select <code>22.x</code> (22.23.3)</li>
                  <li><strong>Application Mode:</strong> Production</li>
                  <li><strong>Application Root:</strong> <code>radar-backend</code> (or upload folder)</li>
                  <li><strong>Application Startup File:</strong> <code>src/server.js</code></li>
                </ul>
              </li>
              <li>Upload the backend folder contents to that directory via cPanel File Manager or FTP.</li>
              <li>Create a <code className="font-mono text-blue-600">.env</code> file in the application root with your DB password and Telegram Bot tokens.</li>
              <li>Click <strong>Run NPM Install</strong> inside cPanel Node.js App Manager.</li>
            </ol>
          </div>

          {/* Step 3: Frontend Deployment */}
          <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <h4>Step 3: Deploy Frontend Build</h4>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Run <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-700">npm run build</code> in the frontend folder.
              This outputs static production files to <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">frontend/dist</code>.
            </p>
            <p className="text-xs text-slate-600">
              You can upload these files directly to your cPanel domain's <code className="font-mono">public_html</code> or let the Express backend serve them automatically!
            </p>
          </div>

          {/* Step 4: .htaccess for Apache 2.4 Reverse Proxy */}
          <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h4>Step 4: Apache Reverse Proxy (.htaccess)</h4>
              </div>
              <button
                onClick={() => copyToClipboard(htaccessCode)}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
              {htaccessCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}
