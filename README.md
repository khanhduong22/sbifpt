# SBI FPT Innovation Platform

[![Node](https://img.shields.io/badge/Node-v22+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-REST_API-orange.svg)](https://hono.dev)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-purple.svg)](https://www.prisma.io)
[![Security](https://img.shields.io/badge/Audit_Compliance-J--SOX_404_|_ISO_27001-red.svg)](https://www.fisc.or.jp)

Enterprise Financial & Delivery Governance Monorepo for SBI FPT Banking Outsourcing Operations.
Target Deployment: `https://sbifpt.khanhdp.com`

---

## 🏛️ Architecture Overview

```
sbifpt/
├── apps/
│   ├── api/                 # High-performance Hono REST API (Port 4100)
│   └── web/                 # Executive & Operational Dashboard (React + Vite + Tailwind)
├── packages/
│   ├── audit-trail/         # Cryptographic SHA-256 Merkle chain & tamper-proof logger
│   ├── db/                  # Prisma ORM singleton, SQLite schema & enterprise seed data
│   └── shared/              # Shared TypeScript types, DTOs, and margin/billability formulas
```

---

## 🔑 Core Features & Invariants

1. **ODC Physical vs. Timesheet Reconciliation**:
   - Compares physical RFID turnstile badge swipes in ODC rooms against WBS timesheet entries.
   - Detects over-billing risks (`OVER_LOGGED`), unbilled effort leakage (`UNDER_LOGGED`), and security violations (`MISSING_SWIPE`).
2. **Real-Time Financial Margin Intelligence**:
   - Real-time gross margin and billability calculations per project and enterprise-wide.
   - Automated detection of monthly revenue leakage and unbilled engineering hours.
3. **Cryptographic Proof Pack (J-SOX Section 404 & FISC Compliant)**:
   - Tamper-proof SHA-256 hash-chaining of all critical operational events.
   - Merkle Tree batch anchoring with verifiable inclusion proofs.
   - Immediate mathematical detection of any database manipulation.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate Prisma Client & Migrate Database
```bash
pnpm --filter @sbifpt/db push
```

### 3. Seed Enterprise Outsourcing Data
```bash
pnpm --filter @sbifpt/db seed
```

### 4. Run Test Suites
```bash
pnpm test
```

### 5. Launch Hono API Server
```bash
pnpm --filter @sbifpt/api dev
# API runs at http://localhost:4100
# Health check: http://localhost:4100/health
```

---

## 📡 API Endpoints Catalog

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API liveness & timestamp |
| `GET` | `/api/projects/margin-summary` | Project-by-project and overall company financial margin metrics |
| `GET` | `/api/odc/reconcile` | Date/user discrepancy comparison between badge swipes and timesheets |
| `POST` | `/api/odc/reconcile/auto` | 1-Click auto-reconcile with audit block sealing |
| `GET` | `/api/timesheet/today` | Current engineer today's allocation & physical swipe status |
| `POST` | `/api/timesheet/log` | Submit effort allocation with cryptographic audit anchor |
| `GET` | `/api/audit/proof-pack` | J-SOX / ISO 27001 verifiable Merkle proof and SHA-256 chain |
| `GET` | `/api/projects` | List all projects with allocated members |
| `GET` | `/api/employees` | List all 10 employees with billing & cost rates |
