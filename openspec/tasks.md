# OpenSpec Implementation Tasks: SBI FPT Innovation Platform

---

## Phase 1: Core Domain Modeling & Shared Financial Formulas

- [x] **Task 1.1: Shared Mathematical Formulas & Type Definitions (`@sbifpt/shared`)**
  - Implement `calculateGrossMargin(revenue, cost)` with 2-decimal precision and zero-revenue safety guard.
  - Implement `calculateBillabilityRatio(billableHours, totalHours)` ensuring accurate percentage derivation.
  - Implement `classifyMarginHealth(margin, targetMargin)` categorizing projects into `EXCELLENT`, `HEALTHY`, `WARNING`, and `CRITICAL`.
  - Implement `evaluateEffortDiscrepancy(params)` with $\pm 0.5\text{h}$ tolerance window, determining status (`MATCHED`, `OVER_LOGGED`, `UNDER_LOGGED`, `MISSING_SWIPE`), violation codes (`SEC-ODC-001`, `FIN-WBS-002`, `OPS-REV-003`), and trilingual action details (JA/EN/VI).
  - Export comprehensive TypeScript interfaces: `ProjectMarginSummary`, `MarginSummaryResponse`, `ODCReconciliationItem`, `ODCReconciliationSummary`.
  - *Verification*: Run unit tests in `packages/shared` to confirm 100% test pass.

- [x] **Task 1.2: Relational Schema & Database Seeding (`@sbifpt/db`)**
  - Define Prisma schema with models: `User`, `Project`, `ProjectMember`, `TimesheetEntry`, `ODCSwipe`, `AuditLog`.
  - Add composite indexes: `[userId, date]`, `[projectId, date]`, `[odcCardId, swipeDate]`, `[sequence]`.
  - Create seed script with realistic banking ODC data:
    * 10 employees across roles (`EXECUTIVE`, `PM`, `DEV`, `AUDITOR`) with differential billing (\$45–\$85/h) and cost rates (\$16–\$35/h).
    * 3 core projects: `PRJ-SBI-CORE` (SBI Shinsei Bank, target 60%), `PRJ-SBI-NEO` (SBI NeoMobile, target 55%), and `PRJ-BENCH` (Internal Bench, target 0%).
    * Realistic timesheet entries and physical turnstile swipes showcasing compliant matches and discrepancy edge cases.
  - *Verification*: Execute `pnpm --filter @sbifpt/db push` and `pnpm --filter @sbifpt/db seed` to verify clean schema hydration.

---

## Phase 2: Cryptographic Audit Trail & Merkle Proof Engine

- [x] **Task 2.1: Canonical JSON Serialization & Hashing Primitives (`@sbifpt/audit-trail`)**
  - Implement `canonicalJsonStringify(value)` with recursive object key sorting to guarantee deterministic hashing regardless of key insertion order.
  - Implement `computeAuditHash(params)` using SHA-256 with standard formula:
    $\text{SHA256}(H_{n-1} : \text{Seq} : \text{Timestamp} : \text{Action} : \text{Actor} : \text{Payload})$.
  - Pin `GENESIS_HASH` to 64 consecutive zeros (`0`.repeat(64)).
  - *Verification*: Assert deterministic output for permuted JSON keys.

- [x] **Task 2.2: Linear Hash-Chain Verification Routine (`@sbifpt/audit-trail`)**
  - Implement `verifyAuditChain(entries, expectedGenesisHash)` validating:
    * Monotonic sequence continuity ($Seq_i = Seq_{i-1} + 1$).
    * Previous hash link integrity ($CurrentHash_{i-1} == PreviousHash_i$).
    * Content recalculation match ($\text{RecalculatedHash} == CurrentHash_i$).
  - Return detailed diagnostics including `isValid`, `verifiedBlocks`, `errorIndex`, and `errorReason` upon failure.
  - *Verification*: Test against valid chain and simulate bit-level tampering to confirm immediate detection.

- [x] **Task 2.3: Merkle Tree Builder & Inclusion Proofs (`@sbifpt/audit-trail`)**
  - Implement `MerkleTree` class capable of handling both empty sets, string hashes, and audit entry arrays.
  - Implement `buildTree(leaves)` recursive pair hashing with odd-node duplication.
  - Implement `generateProof(leafIndex)` returning sibling hashes and branch positions (`left`/`right`).
  - Implement `MerkleTree.verifyProof(proof, expectedRoot)` static verifier.
  - *Verification*: Build 10-node Merkle tree, generate proof for each node, and verify against root.

---

## Phase 3: High-Performance REST API Controllers

- [x] **Task 3.1: Health & Employee Endpoints (`@sbifpt/api`)**
  - Implement `GET /health` returning service name, status, and ISO timestamp.
  - Implement `GET /api/employees` returning staff directory with billing/cost rates, hourly margins, and project assignments.
  - *Verification*: Invoke endpoints via HTTP test client and verify response status 200.

- [x] **Task 3.2: Real-Time Project Margin Engine (`@sbifpt/api`)**
  - Implement `GET /api/projects` returning project catalog with allocated team members.
  - Implement `GET /api/projects/margin-summary` computing:
    * Individual project logged hours, billable vs non-billable hours, revenue, labor cost, gross profit, and margin health.
    * Portfolio-wide metrics: total revenue, total cost, gross profit, overall margin, billability ratio.
    * Leakage prevention estimates: monthly revenue leakage prevented (\$14,200), unbilled hours, over-billing hours flagged.
  - *Verification*: Benchmark response latency to ensure under 50ms.

- [x] **Task 3.3: ODC Physical Turnstile Reconciliation & Auto-Reconcile (`@sbifpt/api`)**
  - Implement `GET /api/odc/reconcile` cross-referencing timesheets against physical badge swipes by date and user.
  - Calculate delta hours, evaluate discrepancies against $\pm 0.5\text{h}$ tolerance, and determine risk levels.
  - Implement `POST /api/odc/reconcile/auto` executing 1-click batch reconciliation:
    * Updates compliant `MATCHED` entries to `APPROVED`.
    * Updates `OVER_LOGGED` and `MISSING_SWIPE` entries to `FLAGGED`.
    * Seals the execution run in an immutable `AuditLog` block chained to the previous hash.
  - *Verification*: Execute auto-reconcile and confirm database state updates and audit block creation.

- [x] **Task 3.4: 10-Second Timesheet Logging Engine (`@sbifpt/api`)**
  - Implement `GET /api/timesheet/today` returning current engineer's assigned projects, today's badge swipes, and logged hours.
  - Implement `POST /api/timesheet/log` with strict Zod validation:
    * Validates user ID, date format (`YYYY-MM-DD`), and non-empty allocation array.
    * Creates timesheet entries in database.
    * Computes SHA-256 block hash and inserts new sealed block into `AuditLog`.
  - *Verification*: Post valid timesheet payload and assert creation of chained audit block.

- [x] **Task 3.5: Cryptographic Proof Pack Inspector Endpoint (`@sbifpt/api`)**
  - Implement `GET /api/audit/proof-pack` running full audit chain verification and constructing the active Merkle Tree root.
  - Return verifiable payload containing `chainValid`, `merkleRoot`, `verifiedBlocks`, `complianceStandard`, and formatted `auditTrail`.
  - *Verification*: Query endpoint and confirm `chainValid: true` and non-empty `merkleRoot`.

---

## Phase 4: Executive Dashboard, ODC Workbench & Timesheet UI

- [x] **Task 4.1: UI Shell & Navigation Architecture (`@sbifpt/web`)**
  - Setup Vite + React 19 SPA with Tailwind CSS design system.
  - Build navigation header with SBI FPT branding, live system clock, and role switcher (`Executive`, `PM`, `Dev`, `Auditor`).
  - Implement primary navigation tabs: Executive Dashboard, ODC Governance Workbench, 10-Sec Timesheet, J-SOX Audit Inspector.
  - *Verification*: Verify responsive layout and active tab transitions.

- [x] **Task 4.2: Executive Financial Margin Dashboard**
  - Render company-wide KPI metric cards: Total Revenue, Total Labor Cost, Gross Profit, Overall Margin %, and Billability Ratio %.
  - Render Revenue Leakage counter showcasing prevented losses (\$14,200/mo) and flagged hours.
  - Render Project Margin Cards for `PRJ-SBI-CORE`, `PRJ-SBI-NEO`, and `PRJ-BENCH` with target margin comparison progress bars and health badges.
  - *Verification*: Verify real-time financial math matches API response.

- [x] **Task 4.3: ODC Reconciliation Workbench & 1-Click Action**
  - Build discrepancy summary banner: Matched records, Over-logged risks, Under-logged leakage, Missing swipes.
  - Render interactive reconciliation table with employee details, hours comparison, delta indicator, and status pills.
  - Embed 1-Click "Auto-Reconcile & Seal Audit Block" button with loading state and confirmation banner displaying sealed block hash.
  - Implement trilingual violation guidance card (JA/EN/VI).
  - *Verification*: Trigger auto-reconcile and confirm instantaneous UI update and block sealing feedback.

- [x] **Task 4.4: 10-Second Smart Timesheet Modal**
  - Build smart effort allocation modal pre-filling physical presence from today's turnstile swipe (e.g. 8.0h).
  - Implement automatic effort distribution slider matching project member percentages (e.g. 60% Core Banking, 40% NeoMobile).
  - Enable 1-click submission with instant audit sealing feedback (< 10 seconds total interaction).
  - *Verification*: Complete timesheet submission flow and verify entry creation in database.

- [x] **Task 4.5: J-SOX 404 Cryptographic Audit Inspector**
  - Render cryptographic status header displaying Chain Verification status (Green/Red), Total Blocks, Verified Blocks, and Merkle Root hash.
  - Display visual hash-chain sequence detailing Sequence #, Timestamp, Action, Actor, Previous Hash, and Current Hash with truncation and copy functionality.
  - Highlight tamper-proof guarantee and Japanese financial compliance badge (J-SOX 404 / FISC / ISO 27001).
  - *Verification*: Confirm live rendering of all sealed audit blocks.

---

## Phase 5: Verification, Benchmarking & Compliance Sign-Off

- [x] **Task 5.1: Monorepo Integration & Unit Test Verification**
  - Execute monorepo test suite across all packages:
    * `@sbifpt/shared`: Formula unit tests.
    * `@sbifpt/audit-trail`: Cryptographic hash-chain and Merkle tree verification tests.
    * `@sbifpt/api`: Route handler and reconciliation tests.
  - *Verification*: 100% pass across all test suites.

- [x] **Task 5.2: API Latency & Performance Benchmark**
  - Benchmark `/api/projects/margin-summary` and `/api/odc/reconcile` under concurrent requests.
  - Verify API response times remain $\le 50\text{ms}$.
  - Verify memory consumption remains $\le 60\text{MB}$ RAM.
  - *Verification*: Confirm sub-50ms latency metrics.

- [x] **Task 5.3: J-SOX 404 Tamper Detection Adversarial Test**
  - Programmatically inject an altered record into the database table to simulate a rogue DBA edit.
  - Verify that `verifyAuditChain()` immediately flags `chainValid: false` and pinpoints the exact sequence index.
  - Restore clean state and verify return to `chainValid: true`.
  - *Verification*: Confirm 100% tamper detection accuracy.
