# RenewRadar - REST API Documentation

This document describes all endpoints provided by the RenewRadar Express REST API, including authentication headers, parameters, request payloads, and response structures.

---

## 🔒 Authentication Scheme

All API routes (except `POST /api/auth/login`) require Bearer Token authentication via the standard HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are signed using HMAC SHA-256 and verified on every incoming request. Admin-restricted endpoints additionally enforce an administrative role check.

---

## 🔑 Authentication Endpoints

### 1. Authenticate & Log In
- **Route**: `POST /api/auth/login`
- **Auth Required**: No (Public)
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "your_admin_password"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "user_id": 1,
        "username": "admin",
        "role": "admin"
      }
    }
  }
  ```

### 2. Verify Session
- **Route**: `GET /api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response `200 OK`**: Returns current authenticated user token metadata.

---

## 📊 Dashboard Endpoints

### 1. Get Summary Metrics
- **Route**: `GET /api/dashboard/summary`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: Aggregated counts, revenue calculations, urgent client call list, and platform distributions.

---

## 🌐 Domains Endpoints

### 1. List Domains
- **Route**: `GET /api/domains`
- **Auth Required**: Yes (`Bearer <token>`)
- **Query Parameters**:
  - `search` (string): Search by domain name, client name, or notes.
  - `account` (string): Filter by registrar / platform name.
  - `status` (string): Filter by status (`active`, `expiring_soon`, `expired`).
  - `clientId` (number): Filter by client ID.
- **Response**: List of domains with calculated `days_remaining` and status.

### 2. Create Domain
- **Route**: `POST /api/domains`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "domain_name": "example.com",
    "client_id": 1,
    "registrar": "Namecheap",
    "account_label": "Namecheap Account 1",
    "registration_date": "2025-01-01",
    "expiry_date": "2026-01-01",
    "cost_price": 13.99,
    "client_price": 25.00,
    "auto_renew": 0,
    "notes": "Client domain"
  }
  ```

### 3. Update Domain
- **Route**: `PUT /api/domains/:id`
- **Auth Required**: Yes (`Bearer <token>`)

### 4. 1-Click Renew Domain
- **Route**: `POST /api/domains/:id/renew`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "years": 1
  }
  ```

### 5. Delete Domain
- **Route**: `DELETE /api/domains/:id`
- **Auth Required**: Yes (`Bearer <token>`)
- **Security**: Scoped by `user_id` to prevent modifying or deleting foreign records.

---

## 🖥 Hostings Endpoints

### 1. List Hosting Plans
- **Route**: `GET /api/hostings`
- **Auth Required**: Yes (`Bearer <token>`)

### 2. Create Hosting Plan
- **Route**: `POST /api/hostings`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "package_name": "20GB Pro cPanel",
    "client_id": 1,
    "provider": "Hostinger",
    "server_name": "Cloud Server 1",
    "ip_address": "192.0.2.1",
    "primary_domain": "example.com",
    "expiry_date": "2026-01-01",
    "billing_cycle": "annual",
    "cost_price": 45.00,
    "client_price": 90.00
  }
  ```

### 3. 1-Click Renew Hosting
- **Route**: `POST /api/hostings/:id/renew`
- **Auth Required**: Yes (`Bearer <token>`)

### 4. Delete Hosting Plan
- **Route**: `DELETE /api/hostings/:id`
- **Auth Required**: Yes (`Bearer <token>`)
- **Security**: Scoped by `user_id`.

---

## 📦 Combo Bundles Endpoints

### 1. Create Linked Combo Bundle
- **Route**: `POST /api/bundles`
- **Auth Required**: Yes (`Bearer <token>`)
- **Description**: Atomically inserts both a domain and hosting record in a single database transaction, linking their IDs together for synchronized expiry tracking.

### 2. Synchronized Bundle Renewal
- **Route**: `POST /api/bundles/renew`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "domainId": 1,
    "hostingId": 1,
    "years": 1
  }
  ```

---

## 👥 Clients Endpoints

- `GET /api/clients` - List all clients with linked asset counters.
- `POST /api/clients` - Create a new client profile.
- `PUT /api/clients/:id` - Update client information.
- `DELETE /api/clients/:id` - Delete client profile (unlinks associated domains & hostings).

---

## 🏢 Platforms & Providers Endpoints

- `GET /api/platforms` - List all platforms with asset counts.
- `POST /api/platforms` - Create platform (**Requires Admin Role**).
- `PUT /api/platforms/:id` - Update platform (**Requires Admin Role**).
- `DELETE /api/platforms/:id` - Delete platform (**Requires Admin Role**).

---

## 🤖 Telegram & Reminder Endpoints

- `GET /api/telegram/status` - Live bot status, configuration state, and recent notification logs.
- `GET /api/telegram/settings` - Retrieve alert tier thresholds and cron trigger time.
- `POST /api/telegram/settings` - Update Telegram Bot Token, Chat ID, and Alert Schedule (**Requires Admin Role**).
- `POST /api/telegram/test` - Dispatch live test alert message (**Requires Admin Role**).
- `POST /api/telegram/trigger-check` - Manually trigger an immediate expiry scan cycle (**Requires Admin Role**).
- `GET /api/telegram/logs` - Retrieve historical notification logs scoped by user.
