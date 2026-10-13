# SBI FPT Innovation Platform — OpenAPI 3.1.0 Contract Specification

```yaml
openapi: 3.1.0
info:
  title: SBI FPT Enterprise ODC Delivery Governance & Margin Engine API
  version: 1.0.0
  description: >
    Production-grade RESTful API specification for SBI FPT Joint Venture.
    Powers Real-Time Project Margin Tracking, Physical ODC Turnstile vs. WBS Timesheet
    Reconciliation, 10-Second Smart Allocation, and Japanese Financial Regulatory Compliance
    (J-SOX 404, FISC Safety Standards, ISO 27001).
  contact:
    name: SBI FPT Architecture & Compliance Office
    email: architecture@sbi-fpt.com
    url: https://sbifpt.khanhdp.com

servers:
  - url: https://sbifpt.khanhdp.com
    description: Production Contabo VPS Gateway (Caddy 2 Reverse Proxy, SSL Strict)
  - url: http://localhost:4100
    description: Local Development Server (Hono Micro-framework)

paths:
  /health:
    get:
      summary: System Health & Liveness Probe
      description: Returns service status, system clock, and version metadata for uptime monitors.
      operationId: getHealth
      tags:
        - System
      responses:
        '200':
          description: Service is healthy and operational.
          content:
            application/json:
              schema:
                type: object
                required:
                  - status
                  - service
                  - version
                  - timestamp
                  - iso
                properties:
                  status:
                    type: string
                    example: ok
                  service:
                    type: string
                    example: sbifpt-api
                  version:
                    type: string
                    example: 1.0.0
                  timestamp:
                    type: integer
                    example: 1776054685000
                  iso:
                    type: string
                    format: date-time
                    example: '2026-10-13T04:31:25.000Z'

  /api/projects:
    get:
      summary: List All Active Banking Projects
      description: Retrieves the complete catalog of projects with allocated team members and budget hours.
      operationId: getProjects
      tags:
        - Projects
      responses:
        '200':
          description: List of projects retrieved successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - projects
                  - count
                properties:
                  count:
                    type: integer
                    example: 3
                  projects:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProjectWithMembers'

  /api/projects/margin-summary:
    get:
      summary: Executive Real-Time Margin & Financial Summary
      description: >
        Computes real-time gross margin, billability ratio, revenue, and labor costs
        aggregated across the organization and broken down project-by-project.
        Identifies monthly revenue leakage and unbilled hours.
      operationId: getMarginSummary
      tags:
        - Executive Finance
      responses:
        '200':
          description: Comprehensive financial and margin summary.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MarginSummaryResponse'

  /api/odc/reconcile:
    get:
      summary: ODC Turnstile vs. Timesheet Reconciliation Workbench
      description: >
        Compares physical RFID turnstile badge swipes against software WBS timesheets
        for a given date or user. Applies a +-0.5h tolerance window to classify entries into
        MATCHED, OVER_LOGGED, UNDER_LOGGED, or MISSING_SWIPE.
      operationId: getODCReconcile
      tags:
        - ODC Governance
      parameters:
        - name: date
          in: query
          required: false
          description: Date to filter records (format YYYY-MM-DD). Defaults to all available records.
          schema:
            type: string
            format: date
            example: '2026-10-13'
        - name: userId
          in: query
          required: false
          description: Specific employee ID to filter.
          schema:
            type: string
            example: 'cuid_emp_001'
        - name: status
          in: query
          required: false
          description: Filter by reconciliation status.
          schema:
            type: string
            enum: [MATCHED, OVER_LOGGED, UNDER_LOGGED, MISSING_SWIPE]
            example: 'OVER_LOGGED'
      responses:
        '200':
          description: Detailed reconciliation list with summary statistics.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ODCReconcileResponse'

  /api/odc/reconcile/auto:
    post:
      summary: 1-Click Auto-Reconcile & Seal Cryptographic Audit Block
      description: >
        Executes automated batch reconciliation:
        - Sets compliant MATCHED records to APPROVED.
        - Sets OVER_LOGGED and MISSING_SWIPE records to FLAGGED.
        - Computes a canonical SHA-256 block hash chained to the previous ledger entry.
        - Seals the batch into the immutable AuditLog table.
      operationId: autoReconcile
      tags:
        - ODC Governance
      responses:
        '200':
          description: Auto-reconciliation completed and audit block sealed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AutoReconcileResult'

  /api/timesheet/today:
    get:
      summary: Get Today's Allocation & Physical Presence for Engineer
      description: >
        Retrieves the authenticated engineer's project allocations, today's turnstile swipe hours,
        and submitted entries. Powers the 10-Second Smart Allocation modal.
      operationId: getTodayTimesheet
      tags:
        - Timesheet
      parameters:
        - name: userId
          in: query
          required: false
          description: User ID of the engineer. Defaults to demo senior developer if omitted.
          schema:
            type: string
            example: 'cuid_emp_002'
      responses:
        '200':
          description: Today's timesheet state and turnstile presence.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodayTimesheetResponse'
        '404':
          description: User not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/timesheet/log:
    post:
      summary: Log Smart Effort Allocation (10-Second Workflow)
      description: >
        Submits effort allocations across one or more projects (e.g. 60% Core, 40% Neo).
        Validates against physical hours, writes records, and automatically seals
        a new block in the SHA-256 cryptographic audit chain.
      operationId: logTimesheet
      tags:
        - Timesheet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LogTimesheetRequest'
      responses:
        '200':
          description: Timesheet logged and cryptographically sealed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LogTimesheetResponse'
        '400':
          description: Validation failure (e.g. hours exceed 24h, missing fields).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: User not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/audit/proof-pack:
    get:
      summary: Generate J-SOX 404 / FISC / ISO 27001 Cryptographic Proof Pack
      description: >
        Runs a complete mathematical integrity check over the entire SHA-256 audit chain.
        Constructs a Merkle Tree from all current block hashes, generates inclusion roots,
        and pinpoints any database tampering or retroactive record manipulation.
      operationId: getAuditProofPack
      tags:
        - Audit & Compliance
      responses:
        '200':
          description: Complete audit proof pack with chain verification result.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuditProofPackResponse'

  /api/employees:
    get:
      summary: List Employees with Billing & Cost Rates
      description: Returns staff directory with differential billing rates, cost rates, hourly margin spreads, and assigned projects.
      operationId: getEmployees
      tags:
        - Employees
      responses:
        '200':
          description: Employee directory retrieved successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - employees
                  - count
                properties:
                  count:
                    type: integer
                    example: 10
                  employees:
                    type: array
                    items:
                      $ref: '#/components/schemas/EmployeeRecord'

components:
  schemas:
    ProjectWithMembers:
      type: object
      required:
        - id
        - code
        - name
        - clientName
        - status
        - budgetHours
        - billingType
      properties:
        id:
          type: string
          example: 'prj_cuid_01'
        code:
          type: string
          example: 'PRJ-SBI-CORE'
        name:
          type: string
          example: 'SBI Shinsei Core Banking Modernization'
        clientName:
          type: string
          example: 'SBI Shinsei Bank'
        status:
          type: string
          enum: [ACTIVE, COMPLETED]
          example: 'ACTIVE'
        budgetHours:
          type: number
          example: 12000.0
        billingType:
          type: string
          enum: [TIME_AND_MATERIALS, FIXED_PRICE]
          example: 'TIME_AND_MATERIALS'
        members:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              roleInProject:
                type: string
                example: 'TECH_LEAD'
              allocatedPercentage:
                type: number
                example: 100.0
              user:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  email:
                    type: string
                  role:
                    type: string

    MarginSummaryResponse:
      type: object
      required:
        - companyMetrics
        - projects
        - generatedAt
      properties:
        companyMetrics:
          type: object
          required:
            - totalRevenue
            - totalCost
            - totalGrossProfit
            - overallGrossMargin
            - overallBillabilityRatio
            - totalLoggedHours
            - totalBillableHours
            - totalNonBillableHours
            - activeProjectsCount
            - totalEmployeesCount
            - monthlyRevenueLeakagePrevented
            - unbilledHoursIdentified
            - overbillingHoursFlagged
          properties:
            totalRevenue:
              type: number
              example: 41250.00
            totalCost:
              type: number
              example: 16820.00
            totalGrossProfit:
              type: number
              example: 24430.00
            overallGrossMargin:
              type: number
              description: Percentage ((Revenue - Cost) / Revenue) * 100
              example: 59.22
            overallBillabilityRatio:
              type: number
              description: Percentage (Billable Hours / Total Hours) * 100
              example: 88.45
            totalLoggedHours:
              type: number
              example: 850.0
            totalBillableHours:
              type: number
              example: 751.8
            totalNonBillableHours:
              type: number
              example: 98.2
            activeProjectsCount:
              type: integer
              example: 3
            totalEmployeesCount:
              type: integer
              example: 10
            monthlyRevenueLeakagePrevented:
              type: number
              example: 14200.00
            unbilledHoursIdentified:
              type: number
              example: 12.5
            overbillingHoursFlagged:
              type: number
              example: 9.5
        projects:
          type: array
          items:
            $ref: '#/components/schemas/ProjectMarginSummary'
        generatedAt:
          type: string
          format: date-time
          example: '2026-10-13T04:31:25.000Z'

    ProjectMarginSummary:
      type: object
      required:
        - projectId
        - projectCode
        - projectName
        - clientName
        - billingType
        - totalLoggedHours
        - billableHours
        - nonBillableHours
        - billabilityRatio
        - totalRevenue
        - totalCost
        - grossProfit
        - grossMargin
        - targetMargin
        - marginHealth
      properties:
        projectId:
          type: string
        projectCode:
          type: string
          example: 'PRJ-SBI-CORE'
        projectName:
          type: string
          example: 'SBI Shinsei Core Banking Modernization'
        clientName:
          type: string
          example: 'SBI Shinsei Bank'
        billingType:
          type: string
          example: 'TIME_AND_MATERIALS'
        totalLoggedHours:
          type: number
          example: 420.0
        billableHours:
          type: number
          example: 395.0
        nonBillableHours:
          type: number
          example: 25.0
        billabilityRatio:
          type: number
          example: 94.05
        totalRevenue:
          type: number
          example: 23700.00
        totalCost:
          type: number
          example: 8900.00
        grossProfit:
          type: number
          example: 14800.00
        grossMargin:
          type: number
          example: 62.45
        targetMargin:
          type: number
          example: 60.0
        marginHealth:
          type: string
          enum: [EXCELLENT, HEALTHY, WARNING, CRITICAL]
          example: 'EXCELLENT'

    ODCReconcileResponse:
      type: object
      required:
        - summary
        - items
        - queryDate
        - queryUserId
        - queryStatus
      properties:
        summary:
          type: object
          required:
            - totalEvaluated
            - matchedCount
            - overLoggedCount
            - underLoggedCount
            - missingSwipeCount
            - totalDiscrepancyHours
            - potentialBillingRiskUsd
            - potentialLeakageUsd
          properties:
            totalEvaluated:
              type: integer
              example: 10
            matchedCount:
              type: integer
              example: 7
            overLoggedCount:
              type: integer
              example: 1
            underLoggedCount:
              type: integer
              example: 1
            missingSwipeCount:
              type: integer
              example: 1
            totalDiscrepancyHours:
              type: number
              example: 8.5
            potentialBillingRiskUsd:
              type: number
              example: 225.00
            potentialLeakageUsd:
              type: number
              example: 135.00
        items:
          type: array
          items:
            $ref: '#/components/schemas/ODCReconciliationItem'
        queryDate:
          type: string
          nullable: true
        queryUserId:
          type: string
          nullable: true
        queryStatus:
          type: string
          nullable: true

    ODCReconciliationItem:
      type: object
      required:
        - userId
        - userName
        - userRole
        - date
        - timesheetHours
        - physicalHours
        - deltaHours
        - status
        - riskLevel
        - recommendedAction
        - actionDetails
      properties:
        userId:
          type: string
        userName:
          type: string
          example: 'Nguyen Van Minh'
        userRole:
          type: string
          example: 'SENIOR_DEV'
        date:
          type: string
          example: '2026-10-13'
        timesheetHours:
          type: number
          example: 8.0
        physicalHours:
          type: number
          example: 8.0
        deltaHours:
          type: number
          example: 0.0
        status:
          type: string
          enum: [MATCHED, OVER_LOGGED, UNDER_LOGGED, MISSING_SWIPE]
          example: 'MATCHED'
        riskLevel:
          type: string
          enum: [LOW, MEDIUM, HIGH]
          example: 'LOW'
        violationCode:
          type: string
          nullable: true
          example: 'FIN-WBS-002'
        recommendedAction:
          type: string
          example: 'Effort reconciled with physical presence. Verified compliant.'
        actionDetails:
          type: object
          properties:
            en:
              type: string
            ja:
              type: string
            vi:
              type: string

    AutoReconcileResult:
      type: object
      required:
        - success
        - reconciledCount
        - flaggedCount
        - matchedCount
        - auditLogEntryId
        - blockHash
        - message
        - processedAt
      properties:
        success:
          type: boolean
          example: true
        reconciledCount:
          type: integer
          example: 7
        flaggedCount:
          type: integer
          example: 2
        matchedCount:
          type: integer
          example: 7
        auditLogEntryId:
          type: string
          example: 'cuid_audit_099'
        blockHash:
          type: string
          example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        message:
          type: string
          example: 'Auto-reconciliation executed. Approved 7 compliant records, flagged 2 discrepancies. Audit block #12 sealed.'
        processedAt:
          type: string
          format: date-time

    TodayTimesheetResponse:
      type: object
      required:
        - user
        - date
        - allocatedProjects
        - todayEntries
        - totalLoggedHoursToday
        - physicalHoursToday
      properties:
        user:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
            email:
              type: string
            role:
              type: string
        date:
          type: string
          example: '2026-10-13'
        allocatedProjects:
          type: array
          items:
            type: object
            properties:
              projectId:
                type: string
              projectCode:
                type: string
                example: 'PRJ-SBI-CORE'
              projectName:
                type: string
              allocatedPercentage:
                type: number
                example: 60.0
        todayEntries:
          type: array
          items:
            type: object
        totalLoggedHoursToday:
          type: number
          example: 0.0
        physicalHoursToday:
          type: number
          example: 8.5

    LogTimesheetRequest:
      type: object
      required:
        - userId
        - date
        - allocations
      properties:
        userId:
          type: string
          example: 'cuid_emp_002'
        date:
          type: string
          format: date
          example: '2026-10-13'
        allocations:
          type: array
          minItems: 1
          items:
            type: object
            required:
              - projectId
              - hours
              - taskDescription
              - taskType
            properties:
              projectId:
                type: string
                example: 'prj_cuid_01'
              hours:
                type: number
                minimum: 0.1
                maximum: 24.0
                example: 5.1
              taskDescription:
                type: string
                example: 'Implement FIX protocol message parser for Tokyo stock trade gateway'
              taskType:
                type: string
                enum: [DEV, CODE_REVIEW, MEETING, ODC_SECURITY_TRAINING]
                example: 'DEV'
              isBillable:
                type: boolean
                default: true
                example: true

    LogTimesheetResponse:
      type: object
      required:
        - success
        - message
        - auditBlockSequence
        - blockHash
        - entries
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: 'Successfully logged 2 timesheet entries. Sealed in Audit Block #13.'
        auditBlockSequence:
          type: integer
          example: 13
        blockHash:
          type: string
          example: 'fa48...b891'
        entries:
          type: array
          items:
            type: object

    AuditProofPackResponse:
      type: object
      required:
        - chainValid
        - totalBlocks
        - verifiedBlocks
        - merkleRoot
        - genesisHash
        - latestHash
        - verifiedAt
        - complianceStandard
        - auditTrail
      properties:
        chainValid:
          type: boolean
          example: true
        totalBlocks:
          type: integer
          example: 12
        verifiedBlocks:
          type: integer
          example: 12
        merkleRoot:
          type: string
          example: '9c53f86b162590fa18...4d31'
        genesisHash:
          type: string
          example: '0000000000000000000000000000000000000000000000000000000000000000'
        latestHash:
          type: string
          example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        verifiedAt:
          type: string
          format: date-time
          example: '2026-10-13T04:31:25.000Z'
        complianceStandard:
          type: string
          example: 'J-SOX Section 404 / ISO/IEC 27001:2022 / FISC Safety Standards 9th Ed.'
        tamperingError:
          type: string
          nullable: true
          example: null
        auditTrail:
          type: array
          items:
            type: object
            properties:
              sequence:
                type: integer
                example: 1
              timestamp:
                type: string
              action:
                type: string
                example: 'GENESIS_BLOCK'
              actor:
                type: string
                example: 'System Initializer (SYSTEM)'
              hash:
                type: string
              previousHash:
                type: string
              tamperDetected:
                type: boolean
                example: false

    EmployeeRecord:
      type: object
      required:
        - id
        - name
        - email
        - role
        - billingRatePerHour
        - costRatePerHour
        - marginPerHour
        - assignedProjects
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
        role:
          type: string
        billingRatePerHour:
          type: number
          example: 65.0
        costRatePerHour:
          type: number
          example: 22.0
        marginPerHour:
          type: number
          example: 43.0
        odcCardId:
          type: string
          nullable: true
        department:
          type: string
        assignedProjects:
          type: array
          items:
            type: object

    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          example: 'User not found'
        details:
          type: object
          nullable: true
```
