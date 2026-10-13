import {
  BillingType,
  ProjectRole,
  ProjectStatus,
  ReconciliationStatus,
  RiskLevel,
  TaskType,
  TimesheetStatus,
  UserRole,
} from './constants';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  billingRatePerHour: number;
  costRatePerHour: number;
  odcCardId?: string | null;
  avatarUrl?: string | null;
  department?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProjectDto {
  id: string;
  code: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  budgetHours: number;
  billingType: BillingType;
  members?: ProjectMemberDto[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProjectMemberDto {
  id: string;
  projectId: string;
  userId: string;
  roleInProject: ProjectRole;
  allocatedPercentage: number;
  user?: UserDto;
  project?: ProjectDto;
}

export interface TimesheetEntryDto {
  id: string;
  userId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  taskDescription: string;
  taskType: TaskType;
  isBillable: boolean;
  status: TimesheetStatus;
  user?: UserDto;
  project?: ProjectDto;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ODCSwipeDto {
  id: string;
  userId: string;
  odcCardId: string;
  swipeDate: string; // YYYY-MM-DD
  swipeIn: string | Date;
  swipeOut?: string | Date | null;
  totalPhysicalHours: number;
  roomCode: string;
  user?: UserDto;
  createdAt?: string | Date;
}

export interface AuditLogDto {
  id: string;
  sequence: number;
  timestamp: string | Date;
  action: string;
  actorId: string;
  detailsJson: string;
  previousHash: string;
  currentHash: string;
  actor?: UserDto | null;
}

export interface ProjectMarginSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  billingType: BillingType;
  totalLoggedHours: number;
  billableHours: number;
  nonBillableHours: number;
  billabilityRatio: number; // percentage (0 - 100)
  totalRevenue: number; // in USD
  totalCost: number; // in USD
  grossProfit: number; // totalRevenue - totalCost
  grossMargin: number; // percentage (0 - 100)
  targetMargin: number; // percentage (0 - 100)
  marginHealth: 'EXCELLENT' | 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ExecutiveCompanyMetrics {
  totalRevenue: number;
  totalCost: number;
  totalGrossProfit: number;
  overallGrossMargin: number; // percentage
  overallBillabilityRatio: number; // percentage
  totalLoggedHours: number;
  totalBillableHours: number;
  totalNonBillableHours: number;
  activeProjectsCount: number;
  totalEmployeesCount: number;
  monthlyRevenueLeakagePrevented: number; // USD
  unbilledHoursIdentified: number;
  overbillingHoursFlagged: number;
}

export interface MarginSummaryResponse {
  companyMetrics: ExecutiveCompanyMetrics;
  projects: ProjectMarginSummary[];
  generatedAt: string;
}

export interface ODCReconciliationItem {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  odcCardId: string;
  department: string;
  projectCode?: string;
  projectName?: string;
  timesheetHours: number;
  physicalHours: number;
  deltaHours: number; // timesheetHours - physicalHours
  status: ReconciliationStatus;
  riskLevel: RiskLevel;
  violationCode?: string;
  recommendedAction: string;
  actionDetails: {
    en: string;
    ja: string;
    vi: string;
  };
}

export interface ODCReconciliationSummary {
  totalRecords: number;
  matchedCount: number;
  overLoggedCount: number;
  underLoggedCount: number;
  missingSwipeCount: number;
  totalDiscrepancyHours: number;
  potentialBillingRiskUsd: number;
  potentialLeakageUsd: number;
  auditCompliantRate: number; // percentage
}

export interface ODCReconcileResponse {
  summary: ODCReconciliationSummary;
  items: ODCReconciliationItem[];
  reconciledAt: string;
}

export interface AutoReconcileResult {
  success: boolean;
  reconciledCount: number;
  flaggedCount: number;
  matchedCount: number;
  auditLogEntryId: string;
  blockHash: string;
  message: string;
  processedAt: string;
}

export interface LogEffortAllocationItem {
  projectId: string;
  hours: number;
  taskDescription: string;
  taskType: TaskType;
  isBillable: boolean;
}

export interface LogEffortRequest {
  userId: string;
  date: string; // YYYY-MM-DD
  allocations: LogEffortAllocationItem[];
}

export interface CryptographicProofPack {
  chainValid: boolean;
  totalBlocks: number;
  merkleRoot: string;
  genesisHash: string;
  latestHash: string;
  verifiedAt: string;
  complianceStandard: string;
  auditTrail: {
    sequence: number;
    timestamp: string;
    action: string;
    actor: string;
    hash: string;
    previousHash: string;
    tamperDetected: boolean;
  }[];
}
