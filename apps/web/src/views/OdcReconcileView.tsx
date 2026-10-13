import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  FileCheck2,
  Filter,
  AlertTriangle,
  UserX,
  Clock,
  TrendingDown,
  Languages,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const OdcReconcileView: React.FC = () => {
  const queryClient = useQueryClient();
  const { openJsoxModal, addToast } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLang, setSelectedLang] = useState<'ja' | 'en' | 'vi'>('ja');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['odc-reconcile', statusFilter],
    queryFn: () => api.getOdcReconciliation({ status: statusFilter }),
  });

  // Auto-Reconcile Mutation
  const autoReconcileMutation = useMutation({
    mutationFn: () => api.runAutoReconcile(),
    onSuccess: (result) => {
      addToast({
        type: 'success',
        title: 'Đối soát Tự Động Hoàn Tất',
        message: result.message,
        duration: 5000,
      });
      // Invalidate queries so tables refresh instantly
      queryClient.invalidateQueries({ queryKey: ['odc-reconcile'] });
      queryClient.invalidateQueries({ queryKey: ['margin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-proof-pack'] });
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Lỗi Đối soát Tự Động',
        message: String(err),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Đang đối chiếu dữ liệu quẹt thẻ ODC vs Bảng chấm công WBS...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <h3 className="font-bold text-sm mb-1">Không thể tải dữ liệu Đối soát ODC</h3>
        <p>{String(error || 'Không có dữ liệu')}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { summary, items } = data;

  return (
    <div className="space-y-5">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Đối Soát Quẹt Thẻ Turnstile ODC vs Bảng Công WBS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tự động kiểm soát bất đối xứng giữa cổng phân làn RFID Hà Nội và giờ tính phí Tokyo. Tuân thủ FISC &amp; J-SOX 404.
          </p>
        </div>

        {/* Action Buttons: 1-Click Auto-Reconcile & J-SOX Export */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => autoReconcileMutation.mutate()}
            disabled={autoReconcileMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-60"
          >
            <Zap className={`w-3.5 h-3.5 ${autoReconcileMutation.isPending ? 'animate-spin' : ''}`} />
            <span>
              {autoReconcileMutation.isPending ? 'Đang niêm phong sổ cái...' : '⚡ Đối soát Tự Động (1-Click)'}
            </span>
          </button>

          <button
            onClick={openJsoxModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 shadow-xs transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>📜 Xuất Chứng Chỉ J-SOX 404</span>
          </button>
        </div>
      </div>

      {/* 5 Status Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Records Evaluated */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Tổng Bản Ghi</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.totalRecords}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">10 Nhân sự · 30 Ngày</div>
        </div>

        {/* Card 2: Matched */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Khớp 100%</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {summary.matchedCount}
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-600/80 font-medium">
            {summary.auditCompliantRate}% Đạt chuẩn
          </div>
        </div>

        {/* Card 3: Over-Logged */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>Log Dư WBS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {summary.overLoggedCount}
          </div>
          <div className="mt-0.5 text-[10px] text-rose-500 font-mono">
            Rủi ro: ${summary.potentialBillingRiskUsd.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Under-Logged */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Thiếu Log Công</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {summary.underLoggedCount}
          </div>
          <div className="mt-0.5 text-[10px] text-amber-500 font-mono">
            Thất thoát: ${summary.potentialLeakageUsd.toLocaleString()}
          </div>
        </div>

        {/* Card 5: Missing Swipe */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Chưa Quẹt Thẻ</span>
            <UserX className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {summary.missingSwipeCount}
          </div>
          <div className="mt-0.5 text-[10px] text-purple-500 font-medium">Vi phạm An ninh FISC</div>
        </div>
      </div>

      {/* Filter Bar with Status Pills & Multilingual Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Lọc:
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
            }`}
          >
            Tất cả ({summary.totalRecords})
          </button>
          <button
            onClick={() => setStatusFilter('OVER_LOGGED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
              statusFilter === 'OVER_LOGGED'
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
                : 'text-rose-600 border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            Log dư WBS ({summary.overLoggedCount})
          </button>
          <button
            onClick={() => setStatusFilter('UNDER_LOGGED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
              statusFilter === 'UNDER_LOGGED'
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                : 'text-amber-600 border-transparent hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            Thiếu log ({summary.underLoggedCount})
          </button>
          <button
            onClick={() => setStatusFilter('MISSING_SWIPE')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
              statusFilter === 'MISSING_SWIPE'
                ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800'
                : 'text-purple-600 border-transparent hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            Chưa quẹt thẻ ({summary.missingSwipeCount})
          </button>
          <button
            onClick={() => setStatusFilter('MATCHED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
              statusFilter === 'MATCHED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                : 'text-emerald-600 border-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Khớp 100% ({summary.matchedCount})
          </button>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs shrink-0">
          <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <button
            onClick={() => setSelectedLang('ja')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              selectedLang === 'ja'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            日本語
          </button>
          <button
            onClick={() => setSelectedLang('en')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              selectedLang === 'en'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setSelectedLang('vi')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              selectedLang === 'vi'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            VI
          </button>
        </div>
      </div>

      {/* High-Density Reconciliation Table */}
      <div className="rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Ngày &amp; Nhân Sự</th>
                <th className="py-3 px-3">Dự Án / Thẻ RFID</th>
                <th className="py-3 px-2.5 text-right">Giờ Quẹt Thẻ</th>
                <th className="py-3 px-2.5 text-right">Giờ Bảng Công</th>
                <th className="py-3 px-2.5 text-right">Chênh Lệch</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5">Khuyến Nghị &amp; Bút Toán Đối Soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-mono">
              {items.map((item) => {
                let statusBadge = {
                  text: 'Khớp 100%',
                  style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
                };
                if (item.status === 'OVER_LOGGED') {
                  statusBadge = {
                    text: 'Log dư WBS',
                    style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800',
                  };
                } else if (item.status === 'UNDER_LOGGED') {
                  statusBadge = {
                    text: 'Thiếu log công',
                    style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
                  };
                } else if (item.status === 'MISSING_SWIPE') {
                  statusBadge = {
                    text: 'Chưa quẹt thẻ',
                    style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
                  };
                }

                const isDiscrepancy = item.status !== 'MATCHED';
                const actionNote =
                  item.actionDetails?.[selectedLang] || item.recommendedAction;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isDiscrepancy
                        ? 'bg-rose-50/40 dark:bg-rose-950/15 hover:bg-rose-50/70 dark:hover:bg-rose-950/25'
                        : 'hover:bg-slate-50/60 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    {/* Date & Staff */}
                    <td className="py-3 px-3.5 font-sans">
                      <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {item.date}
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {item.userName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.department}
                      </div>
                    </td>

                    {/* Project / RFID */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {item.projectCode || 'CHƯA_PHÂN_BỔ'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        RFID: {item.odcCardId}
                      </div>
                    </td>

                    {/* Turnstile Hours */}
                    <td className="py-3 px-2.5 text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.physicalHours.toFixed(1)}h
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">Turnstile RFID</div>
                    </td>

                    {/* WBS Hours */}
                    <td className="py-3 px-2.5 text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.timesheetHours.toFixed(1)}h
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">Timesheet WBS</div>
                    </td>

                    {/* Delta */}
                    <td className="py-3 px-2.5 text-right">
                      <span
                        className={`font-bold ${
                          item.deltaHours > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.deltaHours < 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {item.deltaHours > 0 ? `+${item.deltaHours}h` : `${item.deltaHours}h`}
                      </span>
                    </td>

                    {/* Compliance Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge.style}`}
                      >
                        {statusBadge.text}
                      </span>
                    </td>

                    {/* Action Note */}
                    <td className="py-3 px-3.5 font-sans text-xs">
                      <div className="text-slate-800 dark:text-slate-200 leading-snug">
                        {actionNote}
                      </div>
                      {item.violationCode && (
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-rose-600 dark:text-rose-400">
                          <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 dark:bg-rose-950 dark:border-rose-800">
                            {item.violationCode}
                          </span>
                          <span className="text-slate-400 font-sans text-[10px]">
                            (Yêu cầu PM xác nhận trước khi lập hóa đơn)
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
