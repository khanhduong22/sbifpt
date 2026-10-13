# OpenSpec Architecture & System Design: SBI FPT Innovation Platform

---

## 1. System Topology & Architectural Principles

The SBI FPT Enterprise ODC Delivery Governance Platform is architected as an enterprise monorepo using pnpm workspaces and clean architectural boundaries.

### 1.1 Architectural Decisions & Invariants
1. **Ultra-Lean Runtime Footprint**: Powered by Hono (lightweight HTTP router) rather than heavy enterprise web frameworks, achieving cold starts under 10ms and memory usage below 60MB RAM.
2. **Zero-Trust Auditability**: All operational adjustments, reconciliation runs, and timesheet entries are immutably anchored in a linear SHA-256 hash-chain with genesis block pinning.
3. **Decoupled Cryptographic Core**: The cryptographic hashing and Merkle Tree engines are encapsulated in `@sbifpt/audit-trail`, completely independent of database or HTTP frameworks to allow standalone verification by Tokyo banking auditors.
4. **Shared Type Safety**: All financial formulas, constants, and DTO interfaces are centralized in `@sbifpt/shared` and consumed synchronously by the API and Web client layers.

```
sbifpt/
├── apps/
│   ├── api/                 # High-performance Hono REST API (Port 4100)
│   └── web/                 # Executive & Operational Dashboard (React 19 + Vite)
├── packages/
│   ├── audit-trail/         # Cryptographic SHA-256 Merkle chain & tamper-proof logger
│   ├── db/                  # Prisma ORM singleton, schema & enterprise seed data
│   └── shared/              # Shared types, DTOs, and margin/billability formulas
```

---

## 2. Component & Data Flow Architecture (Mermaid `flowchart TD`)

```mermaid
flowchart TD
    subgraph ClientLayer["Web Client Layer (apps/web)"]
        DASH["Executive P&L Dashboard"]
        RECON_UI["ODC Governance Workbench"]
        MODAL["10-Sec Timesheet Modal"]
        AUDIT_UI["J-SOX Audit Inspector"]
    end

    subgraph ApiLayer["API Routing & Controllers (apps/api - Port 4100)"]
        H_HEALTH["/health Controller"]
        H_PROJ["/api/projects & /margin-summary"]
        H_ODC["/api/odc/reconcile & /auto"]
        H_TS["/api/timesheet/today & /log"]
        H_AUDIT["/api/audit/proof-pack"]
        H_EMP["/api/employees"]
    end

    subgraph ServiceLayer["Shared Logic & Utilities (packages/shared)"]
        F_MARGIN["Gross Margin & Billability Engine"]
        F_EVAL["Effort Discrepancy Evaluator (Tolerance +-0.5h)"]
        CONSTS["Reconciliation & Compliance Constants"]
    end

    subgraph CryptoLayer["Cryptographic Proof Engine (packages/audit-trail)"]
        HASH_CHAIN["Linear SHA-256 Hash Chain"]
        MERKLE["Merkle Tree Builder & Proof Generator"]
        CANONICAL["Canonical JSON Serializer"]
    end

    subgraph DataLayer["Persistence Layer (packages/db)"]
        PRISMA["Prisma Client Singleton"]
        DB_USERS[("User")]
        DB_PRJ[("Project & ProjectMember")]
        DB_TS[("TimesheetEntry")]
        DB_SWIPES[("ODCSwipe")]
        DB_AUDIT[("AuditLog")]
    end

    DASH -->|HTTP GET| H_PROJ
    RECON_UI -->|HTTP GET / POST| H_ODC
    MODAL -->|HTTP GET / POST| H_TS
    AUDIT_UI -->|HTTP GET| H_AUDIT

    H_PROJ --> F_MARGIN
    H_ODC --> F_EVAL
    H_ODC --> HASH_CHAIN
    H_TS --> HASH_CHAIN
    H_AUDIT --> MERKLE
    H_AUDIT --> HASH_CHAIN

    HASH_CHAIN --> CANONICAL
    MERKLE --> CANONICAL

    H_PROJ --> PRISMA
    H_ODC --> PRISMA
    H_TS --> PRISMA
    H_AUDIT --> PRISMA
    H_EMP --> PRISMA

    PRISMA --> DB_USERS
    PRISMA --> DB_PRJ
    PRISMA --> DB_TS
    PRISMA --> DB_SWIPES
    PRISMA --> DB_AUDIT
```

---

## 3. Reconciliation State Machine (Mermaid `stateDiagram-v2`)

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Timesheet Entry Logged by Engineer
    
    SUBMITTED --> CrossChecking: Compare with Physical Badge Swipes

    state CrossChecking {
        [*] --> CheckZeroPhysical
        CheckZeroPhysical --> CheckTolerance: Physical Hours > 0
        CheckZeroPhysical --> TagMissingSwipe: Physical Hours == 0 & Logged > 0
        
        CheckTolerance --> TagMatched: |Logged - Physical| <= 0.5h
        CheckTolerance --> TagOverLogged: (Logged - Physical) > 0.5h
        CheckTolerance --> TagUnderLogged: (Logged - Physical) < -0.5h
    }

    TagMatched --> MATCHED: Low Risk (Compliant)
    TagOverLogged --> OVER_LOGGED: High Risk (Over-Billing / Audit Risk)
    TagUnderLogged --> UNDER_LOGGED: Medium Risk (Revenue Leakage)
    TagMissingSwipe --> MISSING_SWIPE: High Risk (Physical Security Breach)

    MATCHED --> APPROVED: Automated Approval via /api/odc/reconcile/auto
    OVER_LOGGED --> FLAGGED: Blocked from Client Invoicing
    MISSING_SWIPE --> FLAGGED: Escalated to Security Officer
    UNDER_LOGGED --> PendingAdjustment: Prompt Engineer to Log Remaining Hours

    APPROVED --> CryptographicallySealed: Appended to Hash-Chain
    FLAGGED --> CryptographicallySealed: Appended to Hash-Chain
    CryptographicallySealed --> [*]
```

---

## 4. Cryptographic Proof & Verification Sequence (Mermaid `sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    actor Auditor as J-SOX / Tokyo Banking Auditor
    participant Client as Audit Inspector Web UI
    participant API as Hono REST API
    participant Engine as @sbifpt/audit-trail
    participant DB as AuditLog Database

    Auditor->>Client: Click "Verify Ledger Integrity"
    Client->>API: GET /api/audit/proof-pack
    API->>DB: Fetch All AuditLog entries ORDER BY sequence ASC
    DB-->>API: Return N Records [B_1, B_2, ..., B_N]

    API->>Engine: verifyAuditChain(records, GENESIS_HASH)
    loop For Every Block i from 1 to N
        Engine->>Engine: Check Sequence: Seq_i == Seq_{i-1} + 1
        Engine->>Engine: Check Chain: PrevHash_i == CurrentHash_{i-1}
        Engine->>Engine: Recalculate: CurrentHash_i == SHA256(PrevHash_i : Seq_i : Timestamp : Action : Actor : CanonicalJson(Payload))
    end
    Engine-->>API: ChainVerificationResult { isValid: true, verifiedBlocks: N }

    API->>Engine: new MerkleTree(records)
    Engine->>Engine: Build Merkle Tree Levels from CurrentHashes
    Engine-->>API: MerkleRoot (32-byte hex string)

    API-->>Client: JSON Response { chainValid: true, merkleRoot, verifiedBlocks, auditTrail }
    Client-->>Auditor: Display 100% Cryptographic Integrity Badge & Merkle Proof
```

---

## 5. Mathematical Formulations & Data Structures

### 5.1 Real-Time Financial Margin Equations
1. **Gross Margin**:
   $$GrossMargin(p) = \frac{\text{Revenue}(p) - \text{Cost}(p)}{\text{Revenue}(p)} \times 100\%$$
   Where:
   - $\text{Revenue}(p) = \sum \left( \text{BillableHours} \times \text{UserBillingRate} \right)$
   - $\text{Cost}(p) = \sum \left( \text{TotalHours} \times \text{UserCostRate} \right)$

2. **Billability Ratio**:
   $$BillabilityRatio = \frac{\text{Billable Hours}}{\text{Total Logged Hours}} \times 100\%$$

3. **Margin Health Classification**:
   - `EXCELLENT`: $\text{Margin} \ge \text{Target} + 5\%$
   - `HEALTHY`: $\text{Target} \le \text{Margin} < \text{Target} + 5\%$
   - `WARNING`: $\text{Target} - 10\% \le \text{Margin} < \text{Target}$
   - `CRITICAL`: $\text{Margin} < \text{Target} - 10\%$

### 5.2 Effort Discrepancy Logic
Let $\Delta = H_{\text{timesheet}} - H_{\text{physical}}$ with tolerance $\epsilon = 0.5\text{h}$:
- If $H_{\text{physical}} = 0$ and $H_{\text{timesheet}} > 0 \implies \text{MISSING\_SWIPE}$ (Violation: `SEC-ODC-001`, High Risk).
- If $\Delta > \epsilon \implies \text{OVER\_LOGGED}$ (Violation: `FIN-WBS-002`, High Risk).
- If $\Delta < -\epsilon \implies \text{UNDER\_LOGGED}$ (Violation: `OPS-REV-003`, Medium Risk).
- Otherwise $\implies \text{MATCHED}$ (Compliant, Low Risk).

### 5.3 Cryptographic Hash-Chain Formula
$$H_n = \text{SHA256}\Big( H_{n-1} \mathbin{\Vert} \text{Seq}_n \mathbin{\Vert} \text{Timestamp}_n \mathbin{\Vert} \text{Action}_n \mathbin{\Vert} \text{ActorId}_n \mathbin{\Vert} \text{Canonicalize}(\text{Payload}_n) \Big)$$
Where $H_0 = \text{"0"}^{64}$.

---

## 6. Security & Performance Invariants

1. **Deterministic Hashing**: Canonical JSON serialization ensures identical key order across V8 and Node runtime engines, preventing spurious hash mismatches.
2. **Sub-50ms API Latency**: In-memory relational queries with composite indexing on `(userId, date)` and `(projectId, date)` maintain API response times well below 50ms.
3. **Immutability Protection**: `AuditLog` records cannot be updated or deleted via application logic; any raw SQL update breaks the sequence and hash-link, instantly detectable via `verifyAuditChain`.
4. **Bilingual Operator Support**: All discrepancy cards render English, Japanese, and Vietnamese remediation instructions directly to PMs and BrSEs.

---
