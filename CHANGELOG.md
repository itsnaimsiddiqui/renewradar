# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-26

### Added
- **Core Domain & Hosting Expiry Management**:
  - Full CRUD operations for domain names, registrar accounts, and renewal dates.
  - Full CRUD operations for hosting packages, server IPs, and billing cycles.
  - Linked Combo Bundles: connect domains and hosting plans together for 1-click synchronized renewals.
- **Dynamic Multi-Platform & Provider Support**:
  - Pre-seeded platform registries (Namecheap, Hostinger, HostGator, GoDaddy).
  - Ability to add, edit, and organize multiple accounts per registrar.
- **Client & CRM Portfolio Tracking**:
  - Client profiles with direct call links, email, company details, and linked digital assets.
  - Immediate badge indicators for clients with expired or expiring assets.
- **Automated Telegram Bot & Notifications**:
  - Multi-tier alert cron scheduler (30, 15, 7, 3, 1, 0 days before expiration).
  - Interactive Telegram bot commands (`/start`, `/status`, `/expiring`, `/summary`).
  - In-app dynamic configuration for Telegram Bot token and chat ID with live test triggers.
- **Modern Responsive Dashboard**:
  - Urgent Action Call list with deduplicated combo bundles.
  - Financial summary breakdown (Gross Client Revenue, Cost Price, Projected Net Profit).
  - Platform distribution cards with asset breakdown.
  - Responsive tables with sticky right Actions column and zero text wrapping glitches.
- **Enterprise Security & Database Architecture**:
  - Zero-dependency HMAC SHA-256 JWT authentication.
  - Multi-tenancy and user ownership scoping (`user_id`) on all database operations and deletes.
  - Role-based authorization guarding administrative endpoints.
  - Full MariaDB/MySQL database schema with foreign keys and multi-column indexes.
  - Turnkey Docker Compose configuration with clean MariaDB and web builds.
