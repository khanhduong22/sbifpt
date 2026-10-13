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
  DollarSign,
  Languages,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Shield,
  Eye,
} from 'lucide-react';

export const OdcReconcileView: React.FC = () => {
  const queryClient = useQueryClient();
  const { openJsoxModal, addToast } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLang, setSelectedLang] = useState<'ja' | 'en' | 'vi'>('ja');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
        title: 'Auto-Reconciliation Complete',
        message: result.message,
        duration: 6000,
      });
      // Invalidate queries so tables refresh instantly
      queryClient.invalidateQueries({ queryKey: ['odc-reconcile'] });
      queryClient.invalidateQueries({ queryKey: ['margin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-proof-pack'] });
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Auto-Reconciliation Failed',
        message: String(err),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Inspecting ODC Badge Swipes vs Timesheet WBS Records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300">
        <h3 className="font-bold text-base mb-1">Failed to load ODC Reconciliation</h3>
        <p className="text-sm">{String(error || 'No data')}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, items } = data;

  const totalFlaggedCount =
    summary.overLoggedCount + summary.underLoggedCount + summary.missingSwipeCount;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
              J-SOX 404 & FISC ODC Guard
            </span>
            <span className="text-xs text-slate-400 font-mono">
              FISC Physical Security vs Timesheet Discrepancy Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Japanese ODC Audit & Reconciliation Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Automated compliance reconciliation cross-checking turnstile RFID badge logs in Hanoi ODC
            against billable WBS hours. Prevents client over-invoicing and project revenue leakage.
          </p>
        </div>

        {/* Action Buttons: Auto-Reconcile & J-SOX Proof Pack */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Prominent 1-Click Auto-Reconcile Action */}
          <button
            onClick={() => autoReconcileMutation.mutate()}
            disabled={autoReconcileMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-950/40 border border-amber-400/40 transition-all disabled:opacity-60 group active:scale-95"
          >
            <Zap
              className={`w-4 h-4 text-amber-100 ${
                autoReconcileMutation.isPending ? 'animate-spin' : 'group-hover:scale-125'
              } transition-transform`}
            />
            <span>
              {autoReconcileMutation.isPending
                ? 'Sealing Cryptographic Block...'
                : '⚡ Run 1-Click Auto-Reconcile'}
            </span>
          </button>

          {/* J-SOX Audit Proof Pack Export */}
          <button
            onClick={openJsoxModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all group"
          >
            <FileCheck2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>📜 View &amp; Export J-SOX Audit Proof Pack</span>
          </button>
        </div>
      </div>

      {/* Status Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Days / Records Inspected */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Records Evaluated</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.totalRecords}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Across 10 Staff &amp; 30 Days
          </div>
        </div>

        {/* Card 2: Matched (Compliant) */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Matched (Compliant)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-500 dark:text-emerald-400">
            {summary.matchedCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
            {summary.auditCompliantRate}% Compliance Rate
          </div>
        </div>

        {/* Card 3: Over-Logged (Fraud/Invoice Risk) */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>Over-Logged</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-500 dark:text-rose-400">
            {summary.overLoggedCount}
          </div>
          <div className="mt-1 text-[11px] text-rose-400 font-mono">
            Risk: ${summary.potentialBillingRiskUsd.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Under-Logged (Effort Leakage) */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Under-Logged</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-500 dark:text-amber-400">
            {summary.underLoggedCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-400 font-mono">
            Leakage: ${summary.potentialLeakageUsd.toLocaleString()}
          </div>
        </div>

        {/* Card 5: Missing Swipe (Security Breach) */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider flex items-center justify-between">
            <span>Missing Swipe</span>
            <UserX className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-500 dark:text-purple-400">
            {summary.missingSwipeCount}
          </div>
          <div className="mt-1 text-[11px] text-purple-400 font-medium">
            Physical Security Breach
          </div>
        </div>
      </div>

      {/* Filter Bar & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-navy-800 text-cyan-300 dark:bg-navy-750'
                : 'text-slate-600 dark:text-slate-400 hover:text-white bg-slate-100 dark:bg-navy-850'
            }`}
          >
            All Records ({summary.totalRecords})
          </button>
          <button
            onClick={() => setStatusFilter('OVER_LOGGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'OVER_LOGGED'
                ? 'bg-rose-900 text-rose-200 border border-rose-500/40'
                : 'text-rose-500 dark:text-rose-400 hover:bg-rose-950/40 bg-slate-100 dark:bg-navy-850'
            }`}
          >
            ⚠️ Over-Logged ({summary.overLoggedCount})
          </button>
          <button
            onClick={() => setStatusFilter('UNDER_LOGGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'UNDER_LOGGED'
                ? 'bg-amber-900 text-amber-200 border border-amber-500/40'
                : 'text-amber-500 dark:text-amber-400 hover:bg-amber-950/40 bg-slate-100 dark:bg-navy-850'
            }`}
          >
            📉 Under-Logged ({summary.underLoggedCount})
          </button>
          <button
            onClick={() => setStatusFilter('MISSING_SWIPE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'MISSING_SWIPE'
                ? 'bg-purple-900 text-purple-200 border border-purple-500/40'
                : 'text-purple-500 dark:text-purple-400 hover:bg-purple-950/40 bg-slate-100 dark:bg-navy-850'
            }`}
          >
            🚫 Missing Swipe ({summary.missingSwipeCount})
          </button>
          <button
            onClick={() => setStatusFilter('MATCHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'MATCHED'
                ? 'bg-emerald-900 text-emerald-200 border border-emerald-500/40'
                : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-950/40 bg-slate-100 dark:bg-navy-850'
            }`}
          >
            ✅ Matched ({summary.matchedCount})
          </button>
        </div>

        {/* Multilingual Explanations Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 text-xs shrink-0">
          <Languages className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          <span className="text-[11px] text-slate-400 mr-1">Rule Note:</span>
          <button
            onClick={() => setSelectedLang('ja')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              selectedLang === 'ja'
                ? 'bg-navy-800 text-cyan-300 font-bold'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            日本語 (JA)
          </button>
          <button
            onClick={() => setSelectedLang('en')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              selectedLang === 'en'
                ? 'bg-navy-800 text-cyan-300 font-bold'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            English (EN)
          </button>
          <button
            onClick={() => setSelectedLang('vi')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              selectedLang === 'vi'
                ? 'bg-navy-800 text-cyan-300 font-bold'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Tiếng Việt (VI)
          </button>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-850/90 border-b border-slate-200 dark:border-navy-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date &amp; Staff</th>
                <th className="py-3 px-3">Project / ODC RFID</th>
                <th className="py-3 px-3 text-right">Physical Badge</th>
                <th className="py-3 px-3 text-right">WBS Logged</th>
                <th className="py-3 px-3 text-right">Delta</th>
                <th className="py-3 px-3 text-center">Compliance Status</th>
                <th className="py-3 px-4">Recommended Action &amp; Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-navy-800 font-mono">
              {items.map((item) => {
                let statusBadge = {
                  text: 'MATCHED',
                  style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                };
                if (item.status === 'OVER_LOGGED') {
                  statusBadge = {
                    text: 'OVER-LOGGED',
                    style: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                  };
                } else if (item.status === 'UNDER_LOGGED') {
                  statusBadge = {
                    text: 'UNDER-LOGGED',
                    style: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  };
                } else if (item.status === 'MISSING_SWIPE') {
                  statusBadge = {
                    text: 'MISSING SWIPE',
                    style: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
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
                        ? 'bg-rose-500/5 dark:bg-rose-950/10 hover:bg-rose-500/10 dark:hover:bg-rose-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-navy-850/50'
                    }`}
                  >
                    {/* Date & Employee */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {item.date}
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {item.userName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.department}
                      </div>
                    </td>

                    {/* Project / ODC Card */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-semibold text-cyan-500 dark:text-cyan-400">
                        {item.projectCode || 'UNALLOCATED'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Card: {item.odcCardId}
                      </div>
                    </td>

                    {/* Physical Badge Hours */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.physicalHours.toFixed(1)}h
                      </div>
                      <div className="text-[10px] text-slate-400">Turnstile RFID</div>
                    </td>

                    {/* WBS Logged Hours */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.timesheetHours.toFixed(1)}h
                      </div>
                      <div className="text-[10px] text-slate-400">Timesheet WBS</div>
                    </td>

                    {/* Delta */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`font-extrabold ${
                          item.deltaHours > 0
                            ? 'text-rose-500 dark:text-rose-400'
                            : item.deltaHours < 0
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                      >
                        {item.deltaHours > 0 ? `+${item.deltaHours}h` : `${item.deltaHours}h`}
                      </span>
                    </td>

                    {/* Compliance Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.style}`}
                      >
                        {statusBadge.text}
                      </span>
                    </td>

                    {/* Recommended Action & Multilingual Note */}
                    <td className="py-3.5 px-4 font-sans text-xs">
                      <div className="text-slate-800 dark:text-slate-200 leading-snug">
                        {actionNote}
                      </div>
                      {item.violationCode && (
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-rose-500 dark:text-rose-400">
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                            {item.violationCode}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 font-sans">
                            (Requires PM / Auditor sign-off before invoice)
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
