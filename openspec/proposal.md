# OpenSpec Change Proposal: Enterprise ODC Delivery Governance, Real-Time Project Margin Engine, and Japanese Financial Compliance

---

## 1. Executive Summary & Strategic Context

**Target Organization**: SBI FPT Co., Ltd. (Joint Venture between SBI Holdings, Japan & FPT Software, Vietnam)  
**Initiative**: Enterprise ODC Governance, Financial Margin Intelligence, and Regulatory Compliance Modernization  
**Stakeholders**: Executive Committee (SBI Holdings Tokyo & FPT Software Hanoi), Delivery Unit Heads, Bridge Software Engineers (BrSE), and Japanese Financial Regulators (JFSA / FISC).

### 1.1 Problem Statement & Industry Reality
Offshore Development Centers (ODCs) serving Japanese Tier-1 financial institutions (SBI Shinsei Bank, SBI Sumishin Net Bank, SBI NeoMobile) represent high-margin, high-trust engineering partnerships. However, the standard operating model relies on retroactive, end-of-month manual timesheet reporting via spreadsheets or Atlassian Jira WBS.

This creates four critical failure points:
1. **5%–12% Unbilled Effort Leakage**: Project Managers discover budget exhaustion, out-of-scope tasks, and bench under-utilization only 30–45 days after the fact, causing unrecoverable revenue loss.
2. **Client Dispute & Over-Billing Allegations**: If Jira hours billed to a Japanese client exceed the engineer's verifiable physical presence inside the ODC turnstile security zone, the bank's audit committee flags the delta as fraudulent over-billing, risking multi-million dollar penalties and contract termination.
3. **Engineering Timesheet Friction**: Developers waste 20–30 minutes daily logging into fragmented WBS systems, leading to retroactive guessing and friction.
4. **J-SOX 404 & FISC Audit Deficiencies**: Relational database records lack tamper evidence. Privileged database administrators can theoretically edit records retroactively, violating Section 404 of the Japanese Financial Instruments and Exchange Act.

---

## 2. Architectural Approaches Evaluation

Per architecture governance standards, the following options were evaluated:

| Option | Pros | Cons | Performance & Complexity | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Traditional Enterprise Monolith (Next.js / NestJS + PostgreSQL + Heavy Redis Stack)** | Familiar enterprise stack; rich ecosystem. | High RAM consumption (~500MB+ per container); heavy cold starts; slow batch processing; high VPS infrastructure cost. | Latency: 120–250ms.<br>Complexity: High.<br>Footprint: Heavy. | **REJECTED**: Too heavy for agile ODC scaling; exceeds lean resource budgets. |
| **Option B: Distributed Microservices (Go/Rust API + Event Bus + External Blockchain Ledger)** | Strict boundary isolation; decentralized ledger immutability. | Extreme architectural complexity; high operational overhead; distributed transaction latency; gas fees or private ledger maintenance. | Latency: 80–180ms.<br>Complexity: Extremely High.<br>Footprint: Multi-node cluster. | **REJECTED**: Massive over-engineering (YAGNI violation); violates simple operational governance. |
| **Option C: Lean 3-Tier Monorepo (Hono REST API + Vite React 19 SPA + In-Engine Cryptographic Merkle Hash-Chain)** *(Proposed)* | Sub-50ms latency; zero-dependency cryptographic audit proof engine; type-safe monorepo; low memory footprint (< 60MB RAM); 1-click turnstile-to-WBS auto-reconciliation. | Requires disciplined monorepo package boundaries (`@sbifpt/shared`, `@sbifpt/audit-trail`, `@sbifpt/db`). | Latency: $\le 15$–$35\text{ms}$.<br>Complexity: Low-to-Medium.<br>Footprint: Ultra-lightweight. | **RECOMMENDED**: Optimal balance of enterprise financial rigor, Japanese regulatory compliance, and extreme runtime velocity. |

---

## 3. Core Value Proposition & Capability Matrix

The proposed system delivers four core pillars:

```
+--------------------------------------------------------------------------------------------------+
|                                    FOUR STRATEGIC PILLARS                                        |
+------------------------------------+-------------------------------------------------------------+
| 1. Real-Time Gross Margin Engine   | Instant P&L visibility across accounts (PRJ-SBI-CORE,       |
|                                    | PRJ-SBI-NEO, PRJ-BENCH), eliminating month-end surprises.   |
+------------------------------------+-------------------------------------------------------------+
| 2. Automated Turnstile Reconciler  | Continuous cross-matching of RFID badge presence vs WBS     |
|                                    | logs within +-0.5h tolerance; blocks over-billing fraud.    |
+------------------------------------+-------------------------------------------------------------+
| 3. 10-Second Smart Time Allocation | 1-click effort distribution auto-aligned with contractual   |
|                                    | allocations and badge hours; reduces timesheet time by 90%. |
+------------------------------------+-------------------------------------------------------------+
| 4. J-SOX 404 Cryptographic Proof   | In-memory & on-disk SHA-256 hash chaining + Merkle Tree     |
|                                    | inclusion proofs for Tokyo banking regulatory defense.      |
+------------------------------------+-------------------------------------------------------------+
```

### Quantitative Business Impact:
- **Revenue Leakage Recovered**: Estimated \$14,200/month (\$170,400/year) across a 100-developer ODC.
- **Administrative Friction Reduced**: Timesheet submission time reduced from 25 minutes to **< 10 seconds** per developer per day.
- **Audit Deficiencies Mitigated**: 100% elimination of J-SOX Section 404 timesheet tampering audit findings.

---

## 4. Scope of the Proposal

### In Scope:
1. **Core Domain Model (`@sbifpt/db`)**:
   - SQLite / PostgreSQL-compatible Prisma schema supporting `User`, `Project`, `ProjectMember`, `TimesheetEntry`, `ODCSwipe`, and `AuditLog`.
   - Seed data representing realistic banking ODC accounts (`PRJ-SBI-CORE`, `PRJ-SBI-NEO`, `PRJ-BENCH`) with 10 employees, differential billing/cost rates, and physical swipe records.
2. **Cryptographic Engine (`@sbifpt/audit-trail`)**:
   - SHA-256 linear hash-chaining engine with canonical JSON serialization and genesis hash pinning.
   - Merkle Tree data structure for batch verification and individual audit inclusion proofs.
   - Cryptographic chain verification function with sequence continuity and tamper pinpointing.
3. **High-Performance API (`@sbifpt/api`)**:
   - Fast Hono micro-framework running on Port 4100.
   - Endpoints:
     * `GET /health`: Liveness & system clock.
     * `GET /api/projects/margin-summary`: Real-time portfolio and project gross margin metrics.
     * `GET /api/odc/reconcile`: Comparison of timesheets vs badge swipes with tolerance filtering.
     * `POST /api/odc/reconcile/auto`: 1-Click auto-reconcile with cryptographic audit block sealing.
     * `GET /api/timesheet/today`: Current engineer allocation & today's badge hours.
     * `POST /api/timesheet/log`: 10-second smart effort logging with audit block anchor.
     * `GET /api/audit/proof-pack`: J-SOX 404 & FISC verifiable Merkle proof pack.
     * `GET /api/projects`: List projects and assigned members.
     * `GET /api/employees`: List employees with margin spreads and allocations.
4. **Executive & Operational UI (`@sbifpt/web`)**:
   - Modern Vite + React 19 SPA with Tailwind CSS.
   - Executive Dashboard tab (P&L KPIs, Project Margin health bars, Leakage Counter).
   - ODC Governance tab (Discrepancy table, 1-Click Auto-Reconcile button, Japanese/English violation cards).
   - 10-Second Timesheet Modal (Smart slider/percentage allocation).
   - J-SOX Audit Inspector tab (Live hash-chain visualization, Merkle root display, verification status).

### Out of Scope (Future Phases):
- Physical turnstile hardware motor control (interfacing is via network webhook/database sync).
- Direct banking core mainframe settlement (export is handled via standardized financial CSV/JSON).

---

## 5. Success Metrics & Key Performance Indicators (KPIs)

| Metric | Target | Verification Method |
| :--- | :--- | :--- |
| **API p95 Response Time** | $\le 50\text{ms}$ | Synthetic load test against `/api/projects/margin-summary` |
| **Auto-Reconciliation Throughput** | 10,000 records $\le 1.0\text{s}$ | Automated benchmark script |
| **Audit Chain Tamper Detection** | 100% detection rate | Unit test asserting failure on modified byte |
| **Timesheet Submission Time** | $\le 10\text{ seconds}$ | E2E user flow verification |
| **Regulatory Compliance Score** | 100% adherence | J-SOX 404 & FISC compliance review |

---
