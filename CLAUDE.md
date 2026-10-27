# CLAUDE.md - AI Coding Assistant Guide for RenewRadar

This document provides architectural context, codebase structure, naming conventions, and testing instructions for AI tools and developers working on RenewRadar.

---

## 🏛 Architecture Overview

RenewRadar is organized as a decoupled full-stack monorepo:

1. **Frontend (`React Vite Project/`)**:
   - Single-Page Application (SPA) built with **React 18** and **Vite**.
   - Styled with **TailwindCSS** and **Lucide Icons**.
   - Dynamic API communication through `src/api.js` (supporting relative `/api` paths or decoupled `VITE_API_URL`).
   - Clean view-based architecture (`src/views/`) and modular reusable modals (`src/components/`).

2. **Backend API (`Node Express Project/`)**:
   - RESTful API built on **Node.js** and **Express.js** (`src/server.js`).
   - Dual-mode data persistence: Live **MariaDB / MySQL** (via `mysql2/promise` pool in `src/config/db.js`) with an in-memory mock store for rapid local development.
   - Authentication via custom HMAC SHA-256 JWT tokens with constant-time verification (`src/services/authService.js`).
   - Automated Telegram Bot & Cron Scheduler (`src/services/telegramBot.js`, `src/services/reminderCron.js`).

---

## 📂 Codebase & File Locations

```
RenewRadar/
├── database/
│   ├── schema.sql              # Clean database creation script (tables, keys, indexes)
│   └── seed.sql                # Realistic demo dataset (admin user, clients, domains, bundles)
├── Node Express Project/       # Express API and Telegram Services
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # MariaDB connection pool
│   │   │   └── mockData.js     # Mock data fixtures
│   │   ├── controllers/        # Request handlers (auth, domain, hosting, bundle, etc.)
│   │   ├── middleware/         # JWT auth and role check middlewares
│   │   ├── routes/api.js       # REST route declarations
│   │   ├── services/
│   │   │   ├── authService.js  # HMAC token generation & validation
│   │   │   ├── reminderCron.js # Multi-tier expiry check scheduler
│   │   │   └── telegramBot.js  # Bot commands (/start, /expiring, /summary) & alert dispatcher
│   │   ├── utils/
│   │   │   └── statusHelper.js # Shared status, date math, and count aggregation helpers
│   │   └── server.js           # Express app bootstrap & port binding
│   ├── .env.example            # Single annotated environment variable template
│   └── package.json
├── React Vite Project/         # React Vite Web Frontend
│   ├── src/
│   │   ├── components/         # Modals (Domain, Hosting, Bundle, Client, Confirm)
│   │   ├── views/              # Views (Dashboard, Domains, Hostings, Clients, Platforms, Telegram)
│   │   ├── api.js              # Unified fetch wrapper with auth header injection
│   │   ├── App.jsx             # Navigation, state management, and tab switching
│   │   ├── index.css           # Global styles and Tailwind directives
│   │   └── main.jsx            # React DOM entry point
│   └── vite.config.js
├── docs/
│   └── API.md                  # Complete REST API reference
├── docker-compose.yml          # Turnkey container stack
├── HowToSetup.md               # VPS & Docker deployment documentation
├── CHANGELOG.md                # Version release notes
└── LICENSE-NOTE.md             # Commercial license terms
```

---

## 📐 Coding & Naming Conventions

- **File Naming**:
  - React components/views: PascalCase (e.g., `DomainModal.jsx`, `DashboardView.jsx`).
  - Express controllers/services/routes: camelCase (e.g., `domainController.js`, `telegramBot.js`).
  - Documentation and database scripts: Standard kebab-case or uppercase (e.g., `schema.sql`, `API.md`).
- **Database Access & Safety**:
  - All SQL queries **MUST** be parameterised with placeholder `?` tokens.
  - Never concatenate user input directly into SQL strings.
  - All write and delete queries **MUST** be scoped by `user_id` (e.g., `DELETE FROM domains WHERE id = ? AND user_id = ?`).
- **Authentication**:
  - All API routes (except `POST /api/auth/login` and `GET /api/health`) are protected by `authMiddleware`.
  - Sensitive admin endpoints (e.g., Telegram configuration, platform modifications) require `requireAdmin` role checks.

---

## 🧪 How to Run & Test

### Local Development
```bash
# 1. Start Backend API (Port 5001)
cd "Node Express Project"
npm install
npm run dev

# 2. Start Frontend Dev Server (Port 5173)
cd "../React Vite Project"
npm install
npm run dev
```

### Build & Verification Commands
```bash
# Test Frontend Build
cd "React Vite Project"
npm run build

# Check Dependencies for CVEs
cd "../Node Express Project"
npm audit
cd "../React Vite Project"
npm audit
```
