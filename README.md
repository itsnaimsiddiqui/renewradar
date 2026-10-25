# RenewRadar - Multi-Provider Domain & Hosting Expiry Management System

> **A production-ready SaaS application for agencies, developers, and IT teams to track client domains, hosting servers, and combo bundles across multiple providers (Namecheap, Hostinger, GoDaddy, HostGator, cPanel, etc.) with automated Telegram alerts, custom reminder schedules, and interactive English Q&A.**

---

## 🌟 Key Architecture & Capabilities

1. **Multi-Platform Provider Management**:
   - Add, edit, or delete connected platforms (e.g. **Namecheap Account 1**, **Namecheap Account 2**, **Hostinger**, **HostGator**, **GoDaddy**).
   - Filter and track domain registrars and hosting providers dynamically.

2. **Client Combo Bundles (Domain + Hosting bought together)**:
   - When a domain and hosting package are purchased together for a client, register them as a linked **Combo Bundle**.
   - Shared renewal cycle, combined billing, and 1-click **Renew Combo (+1yr)** extending both assets together.

3. **Urgent Client Call Center**:
   - Automatically prioritizes clients whose domains/hostings are **already expired** or **expiring in &le; 7 days**.
   - Includes direct `tel:...` click-to-call links so you can immediately phone clients from your phone or laptop.

4. **Dynamic Telegram Bot Hub & Reminders**:
   - Configure **Bot Token** and **Telegram Chat ID** directly from the web UI — no terminal or file editing required!
   - Customizable notification tiers: Choose exactly when you want alerts (e.g. **60, 45, 30, 15, 7, 3, 1, and 0 days**).
   - Set custom daily check time (e.g., `09:00 AM`).
   - Dispatches rich Telegram alert cards with client name, phone number, renewal fee, and registrar label.
   - Interactive natural language English queries:
     * *"Which domains are expired?"*
     * *"Which hosting expired?"*
     * *"Who should I call today?"*
     * *"What is expiring soon?"*
     * `/status`, `/expired`, `/expiring`, `/call_list`, `/client <name>`

5. **Clean, Modern SaaS Design**:
   - Built with **React 18 + Tailwind CSS + Lucide Icons**.
   - Fast, clean, mobile-responsive white layout.
   - Instant prototyping: Works right out of the box with in-memory mock fallback even before database setup!

---

## 📁 Project Structure

```
renewradar/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MariaDB / MySQL pool + in-memory development fallback
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── domainController.js
│   │   │   ├── hostingController.js
│   │   │   ├── clientController.js
│   │   │   ├── platformController.js
│   │   │   ├── bundleController.js
│   │   │   └── telegramController.js
│   │   ├── models/
│   │   │   └── schema.sql       # MariaDB / MySQL database schema + seed data
│   │   ├── routes/
│   │   │   └── api.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── telegramBot.js   # Interactive Q&A and alert dispatcher
│   │   │   └── reminderCron.js  # Scheduled automated daily checks
│   │   └── server.js            # Express server (Node.js 18.x - 22.x compatible)
│   ├── .env.example             # Clean configuration template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DomainModal.jsx
│   │   │   ├── HostingModal.jsx
│   │   │   ├── ClientModal.jsx
│   │   │   ├── BundleModal.jsx
│   │   │   ├── PlatformModal.jsx
│   │   │   └── CpanelGuideModal.jsx
│   │   ├── views/
│   │   │   ├── DashboardView.jsx
│   │   │   ├── DomainsView.jsx
│   │   │   ├── HostingsView.jsx
│   │   │   ├── ClientsView.jsx
│   │   │   ├── PlatformsView.jsx
│   │   │   ├── TelegramView.jsx
│   │   │   └── LoginView.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── dist/                    # Production static build
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── DEPLOYMENT_CPANEL.md         # Detailed cPanel step-by-step guide
└── README.md
```

---

## 🚀 Running Locally

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
# Server will run on http://localhost:5001
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend will run on http://localhost:5173 with auto-proxy to backend
```

### Default Credentials:
- **Username:** `admin`
- **Password:** `renewradar2026`

*Note: In development, if database credentials are not yet configured, the system seamlessly runs in **Mock Prototyping Mode** with pre-seeded clients, domains, and hostings so you can test everything right away!*
