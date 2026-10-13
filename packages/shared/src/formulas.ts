import { ReconciliationStatus, RiskLevel } from './constants';
import { ODCReconciliationItem } from './types';

/**
 * Calculate Gross Margin percentage: ((Revenue - Cost) / Revenue) * 100
 */
export function calculateGrossMargin(revenue: number, cost: number): number {
  if (revenue <= 0) return 0;
  const margin = ((revenue - cost) / revenue) * 100;
  return Number(margin.toFixed(2));
}

/**
 * Calculate Billability Ratio: (Billable Hours / Total Logged Hours) * 100
 */
export function calculateBillabilityRatio(billableHours: number, totalHours: number): number {
  if (totalHours <= 0) return 0;
  const ratio = (billableHours / totalHours) * 100;
  return Number(ratio.toFixed(2));
}

/**
 * Classify project margin health compared to target margin
 */
export function classifyMarginHealth(
  margin: number,
  targetMargin: number,
  isBench: boolean = false
): 'EXCELLENT' | 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'BENCH' {
  if (isBench) return 'BENCH';
  if (margin >= targetMargin + 5) return 'EXCELLENT';
  if (margin >= targetMargin) return 'HEALTHY';
  if (margin >= targetMargin - 10) return 'WARNING';
  return 'CRITICAL';
}

/**
 * Evaluate discrepancy between timesheet hours and physical ODC badge swipe hours
 */
export function evaluateEffortDiscrepancy(params: {
  timesheetHours: number;
  physicalHours: number;
  toleranceHours?: number;
}): {
  deltaHours: number;
  status: ReconciliationStatus;
  riskLevel: RiskLevel;
  violationCode?: string;
  recommendedAction: string;
  actionDetails: {
    en: string;
    ja: string;
    vi: string;
  };
} {
  const tolerance = params.toleranceHours ?? 0.5;
  const delta = Number((params.timesheetHours - params.physicalHours).toFixed(2));

  // Condition 1: Missing Physical Swipe (Logged hours, but 0 badge entries)
  if (params.physicalHours === 0 && params.timesheetHours > 0) {
    return {
      deltaHours: delta,
      status: 'MISSING_SWIPE',
      riskLevel: 'HIGH',
      violationCode: 'SEC-ODC-001',
      recommendedAction: 'Security audit required: Work logged with zero physical ODC badge swipes.',
      actionDetails: {
        en: 'Security violation: Work logged on client project without physical ODC room entry. Verify VPN/badge.',
        ja: 'セキュリティ違反：ODCルームへの入退室記録がない状態で工数が記録されています。VPNまたは入館証を確認してください。',
        vi: 'Vi phạm bảo mật: Ghi nhận giờ làm việc dự án nhưng không có quẹt thẻ vào phòng ODC. Cần kiểm tra lại VPN/thẻ.',
      },
    };
  }

  // Condition 2: Over-logged (Timesheet exceeds physical ODC presence beyond tolerance)
  if (delta > tolerance) {
    return {
      deltaHours: delta,
      status: 'OVER_LOGGED',
      riskLevel: 'HIGH',
      violationCode: 'FIN-WBS-002',
      recommendedAction: 'Client over-billing flag: Timesheet exceeds physical ODC badge presence.',
      actionDetails: {
        en: `Over-billing risk: Logged ${params.timesheetHours}h vs ${params.physicalHours}h in ODC (+${delta}h). Requires PM review before client billing.`,
        ja: `過大請求リスク：工数記録 ${params.timesheetHours}h に対し ODC滞在 ${params.physicalHours}h (+${delta}h)。請求前にPMの確認が必要です。`,
        vi: `Rủi ro ghi vượt giờ: Đăng ký ${params.timesheetHours}h nhưng quẹt thẻ thực tế ${params.physicalHours}h (+${delta}h). Cần PM duyệt trước khi xuất hóa đơn.`,
      },
    };
  }

  // Condition 3: Under-logged (Physical presence exceeds timesheet by more than tolerance)
  if (delta < -tolerance) {
    return {
      deltaHours: delta,
      status: 'UNDER_LOGGED',
      riskLevel: 'MEDIUM',
      violationCode: 'OPS-REV-003',
      recommendedAction: 'Revenue leakage: Engineer spent more physical time in ODC than logged in WBS.',
      actionDetails: {
        en: `Effort leakage: Physical ODC ${params.physicalHours}h vs logged ${params.timesheetHours}h (${delta}h). Remind engineer to log missing billable tasks.`,
        ja: `工数漏れ：ODC滞在 ${params.physicalHours}h に対し工数記録 ${params.timesheetHours}h (${delta}h)。未記録のタスクを登録するようエンジニアに促してください。`,
        vi: `Thất thoát công sức: Quẹt thẻ ODC ${params.physicalHours}h nhưng chỉ log ${params.timesheetHours}h (${delta}h). Nhắc nhở nhân sự bổ sung giờ làm việc.`,
      },
    };
  }

  // Condition 4: Clean Match within tolerance
  return {
    deltaHours: delta,
    status: 'MATCHED',
    riskLevel: 'LOW',
    recommendedAction: 'Effort reconciled with physical presence. Verified compliant.',
    actionDetails: {
      en: 'Reconciled: Timesheet matches physical badge presence within allowable tolerance.',
      ja: '照合完了：工数記録とODC入退室記録が許容範囲内で一致しています。監査基準適合。',
      vi: 'Khớp dữ liệu: Giờ chấm công khớp với quẹt thẻ ODC trong ngưỡng cho phép. Đạt chuẩn tuân thủ.',
    },
  };
}
