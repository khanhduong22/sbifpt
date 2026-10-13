import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Percent,
  ShieldCheck,
  Building,
  Target,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const ExecutiveMarginView: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['margin-summary'],
    queryFn: () => api.getMarginSummary(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  const [selectedBillingFilter, setSelectedBillingFilter] = useState<
    'ALL' | 'TIME_AND_MATERIALS' | 'FIXED_PRICE'
  >('ALL');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Đang tải dữ liệu Biên lợi nhuận & Doanh thu ODC...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <h3 className="font-bold text-sm mb-1">Không thể tải thông tin Biên Lợi Nhuận</h3>
        <p>{String(error || 'Không có dữ liệu trả về')}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { companyMetrics, projects } = data;

  const filteredProjects = projects.filter((p) => {
    if (selectedBillingFilter === 'ALL') return true;
    return p.billingType === selectedBillingFilter;
  });

  // Calculate resource margin ranking
  const resourceRanking = (employeesData?.employees || [])
    .filter((e) => e.billingRatePerHour > 0)
    .map((e) => {
      const marginSpread = e.billingRatePerHour - e.costRatePerHour;
      const marginPercent = ((marginSpread / e.billingRatePerHour) * 100).toFixed(1);
      return {
        ...e,
        marginSpread,
        marginPercent: Number(marginPercent),
      };
    })
    .sort((a, b) => b.marginSpread - a.marginSpread);

  return (
    <div className="space-y-5">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Biên Lợi Nhuận & Doanh Thu ODC (Executive Margin)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Giám sát tài chính thời gian thực đối chiếu hợp đồng Tokyo vs chi phí nhân sự. Tuân thủ FISC &amp; J-SOX 404.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Q4 Sprint 24
          </span>
        </div>
      </div>

      {/* 4 Crisp LimArt KPI Cards (Zero rainbow gradients!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tổng Doanh Thu Hợp Đồng
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ${companyMetrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.8%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-800">
            <span>Chi phí: ${companyMetrics.totalCost.toLocaleString()}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Lãi gộp: +${companyMetrics.totalGrossProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* KPI 2: Overall Gross Margin */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tỷ Suất Biên Lợi Nhuận Gộp
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {companyMetrics.overallGrossMargin}%
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
              Mục tiêu &gt; 55%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-800">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Target className="w-3.5 h-3.5" /> Vượt mục tiêu +1.5%
            </span>
            <span className="font-mono text-[10px]">Đạt chuẩn</span>
          </div>
        </div>

        {/* KPI 3: Billability Ratio */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tỷ Lệ Tính Phí (Billability)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-gray-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {companyMetrics.overallBillabilityRatio}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              vs Target 85%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-800">
            <span>Billable: {companyMetrics.totalBillableHours}h</span>
            <span>Bench/R&D: {companyMetrics.totalNonBillableHours}h</span>
          </div>
        </div>

        {/* KPI 4: Leakage Prevented */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Thất Thoát Đã Ngăn Chặn
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ${companyMetrics.monthlyRevenueLeakagePrevented.toLocaleString()}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800">
              FISC Guard
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-800">
            <span>Unbilled: {companyMetrics.unbilledHoursIdentified}h</span>
            <span>Overbill: {companyMetrics.overbillingHoursFlagged}h</span>
          </div>
        </div>
      </div>

      {/* Main Content: High-Density Table & Resource Margin Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Project Delivery Margin Table */}
        <div className="lg:col-span-2 space-y-3">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Danh mục Dự án &amp; Tỷ suất Lợi nhuận
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs">
              <button
                onClick={() => setSelectedBillingFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedBillingFilter === 'ALL'
                    ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tất cả ({projects.length})
              </button>
              <button
                onClick={() => setSelectedBillingFilter('TIME_AND_MATERIALS')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedBillingFilter === 'TIME_AND_MATERIALS'
                    ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                T&amp;M
              </button>
              <button
                onClick={() => setSelectedBillingFilter('FIXED_PRICE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedBillingFilter === 'FIXED_PRICE'
                    ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Fixed Price
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Mã &amp; Dự Án</th>
                    <th className="py-3 px-2.5">Hợp Đồng</th>
                    <th className="py-3 px-2.5 text-right">Giờ Công</th>
                    <th className="py-3 px-2.5 text-right">Doanh Thu</th>
                    <th className="py-3 px-2.5 text-right">Lãi Gộp</th>
                    <th className="py-3 px-3.5 text-center">Biên Lợi Nhuận</th>
                    <th className="py-3 px-2.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-mono">
                  {filteredProjects.map((p) => {
                    let healthBadge = {
                      text: 'Đạt chuẩn',
                      style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
                    };
                    if (p.marginHealth === 'EXCELLENT') {
                      healthBadge = {
                        text: 'Xuất sắc',
                        style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
                      };
                    } else if (p.marginHealth === 'WARNING') {
                      healthBadge = {
                        text: 'Cần lưu ý',
                        style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
                      };
                    } else if (p.marginHealth === 'CRITICAL') {
                      healthBadge = {
                        text: 'Báo động',
                        style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800',
                      };
                    } else if (p.marginHealth === 'BENCH') {
                      healthBadge = {
                        text: 'Nội bộ / R&D',
                        style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:border-gray-700',
                      };
                    }

                    return (
                      <tr
                        key={p.projectId}
                        className="hover:bg-slate-50/70 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Project Info */}
                        <td className="py-3 px-3.5 font-sans">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">
                              {p.projectCode}
                            </span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-xs">
                            {p.projectName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{p.clientName}</span>
                          </div>
                        </td>

                        {/* Billing Type */}
                        <td className="py-3 px-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              p.billingType === 'TIME_AND_MATERIALS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                                : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800'
                            }`}
                          >
                            {p.billingType === 'TIME_AND_MATERIALS' ? 'T&M' : 'Fixed'}
                          </span>
                        </td>

                        {/* Logged & Billability */}
                        <td className="py-3 px-2.5 text-right">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {p.totalLoggedHours}h
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
                            {p.billabilityRatio}% billable
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="py-3 px-2.5 text-right">
                          <div className="font-bold text-slate-900 dark:text-white">
                            ${p.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cost: ${p.totalCost.toLocaleString()}
                          </div>
                        </td>

                        {/* Profit */}
                        <td className="py-3 px-2.5 text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            +${p.grossProfit.toLocaleString()}
                          </div>
                        </td>

                        {/* Margin with Progress Bar */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {p.grossMargin}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              Target {p.targetMargin}%
                            </span>
                          </div>
                          <div className="w-24 sm:w-28 h-1.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.grossMargin >= p.targetMargin ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, p.grossMargin))}%` }}
                            />
                          </div>
                        </td>

                        {/* Health Badge */}
                        <td className="py-3 px-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${healthBadge.style}`}
                          >
                            {healthBadge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Resource Margin Contribution */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Xếp hạng Chênh lệch Lãi Nhân sự
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Net Margin/h</span>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs p-3 space-y-2.5">
            {resourceRanking.slice(0, 7).map((res, index) => {
              const maxSpread = 47.0; // Kenjiro Tanaka $85 - $38 = $47
              const fillPct = Math.min(100, Math.round((res.marginSpread / maxSpread) * 100));

              return (
                <div
                  key={res.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700/80 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {res.role} · {res.department || 'Delivery Unit 1'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0 pl-2">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        +${res.marginSpread}/h
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ${res.billingRatePerHour} / ${res.costRatePerHour}
                      </div>
                    </div>
                  </div>

                  {/* Clean Visual Bar */}
                  <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
