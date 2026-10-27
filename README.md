# RenewRadar - Multi-Provider Domain & Hosting Expiry Management System

> **RenewRadar** is a modern, high-performance web application designed for **freelancers, digital agencies, and IT service providers** to centralize client domain names, hosting packages, and combo bundles across multiple registrars and servers with automated Telegram notifications and bot commands.

Built with **React 18, Vite, Node.js, Express, and MariaDB/MySQL**.

---

## 🎯 Target Users

- **Freelancers & Solopreneurs**: Keep track of client domains and hostings without missing renewals or paying penalty recovery fees.
- **Digital Agencies & Web Studios**: Manage hundreds of client digital assets across Namecheap, Hostinger, GoDaddy, HostGator, and private cPanel VPS servers.
- **IT Managed Service Providers (MSPs)**: Automate expiry warnings and maintain an urgent client outreach pipeline.

---

## ⚡ 5 Core Differentiating Features

1. **Expiry Tracking & Multi-Platform Management**:
   - Automated real-time calculation of days remaining until expiration.
   - Color-coded urgency badges (`Expired`, `Expiring in 5 days`, `Active`).
   - Group domains and hostings by account/platform (e.g., *Namecheap Account 1*, *Hostinger Cloud*).
2. **Renewal Management & Linked Combo Bundles**:
   - Link client domain and hosting packages together into a single **Combo Bundle**.
   - 1-Click synchronized renewal: extends both domain and hosting expiry dates with a single confirmation click.
   - Historical renewal logging and cost vs. client pricing ledger.
3. **Comprehensive Financial & Operations Dashboard**:
   - High-level KPIs: Active Domains, Hosting Servers, Clients, and Total Expired Assets.
   - Financial profit calculation: Gross Client Revenue vs. Asset Cost Price.
   - **Urgent Call Center**: Prioritizes clients whose assets are expiring in $\le 7$ days with direct click-to-call mobile integration.
4. **Automated Multi-Tier Telegram Alerts**:
   - Configurable alert tiers (e.g., 30, 15, 7, 3, 1, and 0 days prior to expiry).
   - Automated scheduled daily scans via cron.
   - Rich Markdown Telegram notification cards sent directly to agency administrators.
5. **Interactive Telegram Bot Commands**:
   - Query system status on the go directly inside Telegram.
   - Supported bot commands: `/start`, `/status`, `/expiring`, `/summary`, `/help`.

---

## 🌐 Live Demo & Testing

- **Live Frontend**: [https://renewradar.netlify.app](https://renewradar.netlify.app)
- **Live API Endpoint**: `https://renewradar-api.fatmonk.studio/api`
- **Demo Administrator Credentials**:
  - **Username**: `admin`
  - **Password**: `renewradar2026`
- **Sample Data Included**: Includes sample domains, hosting servers, combo bundles, and an upcoming 5-day expiry so automated alerts can be immediately previewed.

---

## 📁 Repository Structure

```
RenewRadar/
├── README.md               # Product overview, features, and quickstart
├── HowToSetup.md           # Step-by-step VPS & Docker installation guide
├── CLAUDE.md               # Architectural reference & guide for AI tools
├── CHANGELOG.md            # Release version history starting from v1.0.0
├── LICENSE-NOTE.md         # Commercial licensing terms for buyers
├── docker-compose.yml      # Complete Docker stack (MariaDB + API + Web)
├── database/
│   ├── schema.sql          # Creates complete database from empty with keys & indexes
│   └── seed.sql            # Demo clients, domains, hostings, and bundles
├── docs/
│   └── API.md              # Complete Express API endpoint reference
├── Node Express Project/   # Node.js Express REST API & Telegram Service
│   ├── src/
│   ├── .env.example        # Single annotated configuration file
│   └── package.json
└── React Vite Project/     # React 18 / Vite Single Page Application
    ├── src/
    └── package.json
```

---

## 🚀 Quick Setup

Please see [HowToSetup.md](./HowToSetup.md) for full instructions on VPS and Docker Compose deployments.

### Local Development
```bash
# 1. Start Backend API
cd "Node Express Project"
npm install
npm run dev

# 2. Start Frontend Web App
cd "../React Vite Project"
npm install
npm run dev
```

---

## 📄 Licence

RenewRadar is licensed under commercial terms for single-buyer agency deployments. Please read [LICENSE-NOTE.md](./LICENSE-NOTE.md) for full terms, permissions, and restrictions.
