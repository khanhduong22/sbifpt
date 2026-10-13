export const USER_ROLES = ['EXECUTIVE', 'PM', 'DEV', 'AUDITOR'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROJECT_ROLES = [
  'PROJECT_MANAGER',
  'TECH_LEAD',
  'SENIOR_DEV',
  'COMMUNICATOR',
  'DEVELOPER',
] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const BILLING_TYPES = ['TIME_AND_MATERIALS', 'FIXED_PRICE'] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

export const TASK_TYPES = [
  'DEV',
  'CODE_REVIEW',
  'MEETING',
  'ODC_SECURITY_TRAINING',
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TIMESHEET_STATUSES = ['SUBMITTED', 'APPROVED', 'FLAGGED'] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export const RECONCILIATION_STATUSES = [
  'MATCHED',
  'OVER_LOGGED',
  'UNDER_LOGGED',
  'MISSING_SWIPE',
] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const COMPLIANCE_STANDARDS = {
  J_SOX: 'J-SOX Section 404',
  ISO_27001: 'ISO/IEC 27001:2022',
  FISC: 'FISC Security Guidelines for Financial Information Systems',
} as const;
