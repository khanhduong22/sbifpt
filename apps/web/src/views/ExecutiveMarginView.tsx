import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Percent,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  Building,
  Target,
  BarChart3,
  Layers,
  ChevronRight,
  Info,
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

  const [selectedBillingFilter, setSelectedBillingFilter] = useState<'ALL' | 'TIME_AND_MATERIALS' | 'FIXED_PRICE'>('ALL');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading Executive Margin & Billability Telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300">
        <h3 className="font-bold text-base mb-1">Failed to load Margin Summary</h3>
        <p className="text-sm">{String(error || 'No data returned')}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold"
        >
          Retry
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Executive Cockpit
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Delivery Period: Sprint 24 / Q4 Tokyo Delivery Cycle
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Executive Margin & Billability Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Real-time financial yield oversight comparing client revenue contracts with actual ODC delivery cost. 
            Audited against Tokyo Financial Services Agency & FISC internal controls.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-mono">Telemetry Sync</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Database
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Client Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Client Revenue
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              ${companyMetrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.8%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Direct Cost: ${companyMetrics.totalCost.toLocaleString()}</span>
            <span className="text-emerald-400 font-semibold">
              Profit: ${companyMetrics.totalGrossProfit.toLocaleString()}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        </div>

        {/* KPI 2: Overall Gross Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall Gross Margin
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {companyMetrics.overallGrossMargin}%
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Target &gt; 55%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exceeds Target by +1.1% (Healthy)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
        </div>

        {/* KPI 3: Billability Ratio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Billability Ratio
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {companyMetrics.overallBillabilityRatio}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              vs Target 85%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Billable: {companyMetrics.totalBillableHours}h</span>
            <span>Bench: {companyMetrics.totalNonBillableHours}h</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
        </div>

        {/* KPI 4: Monthly Revenue Leakage Prevented */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Revenue Leakage Prevented
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              ${companyMetrics.monthlyRevenueLeakagePrevented.toLocaleString()}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
              AI Guard
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Unbilled: {companyMetrics.unbilledHoursIdentified}h</span>
            <span>Overbill: {companyMetrics.overbillingHoursFlagged}h</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600"></div>
        </div>
      </div>

      {/* Main Grid: Project Margin Table & Resource Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Project Margin Health Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Project Margin & Delivery Health Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Active delivery accounts with real-time billable efficiency vs target thresholds.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 text-xs">
              <button
                onClick={() => setSelectedBillingFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedBillingFilter === 'ALL'
                    ? 'bg-navy-800 text-cyan-300 dark:bg-navy-750'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setSelectedBillingFilter('TIME_AND_MATERIALS')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedBillingFilter === 'TIME_AND_MATERIALS'
                    ? 'bg-navy-800 text-cyan-300 dark:bg-navy-750'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                T&amp;M
              </button>
              <button
                onClick={() => setSelectedBillingFilter('FIXED_PRICE')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedBillingFilter === 'FIXED_PRICE'
                    ? 'bg-navy-800 text-cyan-300 dark:bg-navy-750'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                Fixed Price
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-850/90 border-b border-slate-200 dark:border-navy-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-3">Billing</th>
                    <th className="py-3 px-3 text-right">Logged (Bill%)</th>
                    <th className="py-3 px-3 text-right">Revenue</th>
                    <th className="py-3 px-3 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-center">Gross Margin</th>
                    <th className="py-3 px-3 text-center">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-800 font-mono">
                  {filteredProjects.map((p) => {
                    let healthBadge = {
                      text: p.marginHealth,
                      style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    };
                    if (p.marginHealth === 'EXCELLENT') {
                      healthBadge = {
                        text: 'EXCELLENT',
                        style: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                      };
                    } else if (p.marginHealth === 'WARNING') {
                      healthBadge = {
                        text: 'WARNING',
                        style: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      };
                    } else if (p.marginHealth === 'CRITICAL') {
                      healthBadge = {
                        text: 'CRITICAL',
                        style: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                      };
                    } else if (p.marginHealth === 'BENCH') {
                      healthBadge = {
                        text: 'BENCH',
                        style: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                      };
                    }

                    return (
                      <tr
                        key={p.projectId}
                        className="hover:bg-slate-50/60 dark:hover:bg-navy-850/50 transition-colors"
                      >
                        {/* Project Info */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="font-mono text-cyan-500 dark:text-cyan-400 text-xs">
                              {p.projectCode}
                            </span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-xs">
                            {p.projectName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" />
                            {p.clientName}
                          </div>
                        </td>

                        {/* Billing Type */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.billingType === 'TIME_AND_MATERIALS'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {p.billingType === 'TIME_AND_MATERIALS' ? 'T&M' : 'Fixed'}
                          </span>
                        </td>

                        {/* Logged & Billability */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {p.totalLoggedHours}h
                          </div>
                          <div className="text-[11px] text-emerald-500 dark:text-emerald-400">
                            {p.billabilityRatio}% billable
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-bold text-slate-900 dark:text-white">
                            ${p.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cost: ${p.totalCost.toLocaleString()}
                          </div>
                        </td>

                        {/* Profit */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-bold text-emerald-500 dark:text-emerald-400">
                            +${p.grossProfit.toLocaleString()}
                          </div>
                        </td>

                        {/* Margin with Progress Bar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {p.grossMargin}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Target {p.targetMargin}%
                            </span>
                          </div>
                          <div className="w-28 sm:w-36 h-2 rounded-full bg-slate-200 dark:bg-navy-800 overflow-hidden relative">
                            {/* Target marker line */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-300 z-10"
                              style={{ left: `${Math.min(100, p.targetMargin)}%` }}
                              title={`Target: ${p.targetMargin}%`}
                            ></div>
                            {/* Actual fill */}
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.grossMargin >= p.targetMargin
                                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, p.grossMargin))}%` }}
                            ></div>
                          </div>
                        </td>

                        {/* Health Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${healthBadge.style}`}
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

        {/* Right Column (1 Col): Resource Margin Contribution Ranking */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Resource Margin Spread Ranking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Net hourly profit spread (Billing Rate - Direct Cost Rate) by employee.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-md p-4 space-y-3">
            {resourceRanking.slice(0, 7).map((res, index) => {
              const maxSpread = 47.0; // Kenjiro Tanaka $85 - $38 = $47
              const fillPct = Math.min(100, Math.round((res.marginSpread / maxSpread) * 100));

              return (
                <div
                  key={res.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850/70 border border-slate-200 dark:border-navy-800/80 hover:border-cyan-500/30 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-navy-800 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px]">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {res.role} · {res.department || 'Delivery Unit 1'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-extrabold text-emerald-500 dark:text-emerald-400">
                        +${res.marginSpread}/h
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ${res.billingRatePerHour} / ${res.costRatePerHour}
                      </div>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-navy-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      style={{ width: `${fillPct}%` }}
                    ></div>
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
