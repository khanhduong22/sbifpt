import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, UserTodayTimesheetResponse, LogEffortResponse } from '../lib/api';
import { useStore } from '../store/useStore';
import { TaskType } from '@sbifpt/shared';
import {
  Sliders,
  Clock,
  Radio,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Building,
  Hash,
  Sparkles,
  Calendar,
  Lock,
} from 'lucide-react';

interface ProjectAllocationState {
  projectId: string;
  projectCode: string;
  projectName: string;
  percentage: number;
  hours: number;
  taskDescription: string;
  taskType: TaskType;
  isBillable: boolean;
}

export const EffortSliderView: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedDeveloperId, setSelectedDeveloperId, addToast } = useStore();

  // Load all employees for switcher
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  // Default to first DEV employee (e.g. Tran Duc Minh) if not set
  useEffect(() => {
    if (!selectedDeveloperId && employeesData?.employees?.length) {
      const dev =
        employeesData.employees.find((e) => e.email === 'minh.td@sbi-fpt.com') ||
        employeesData.employees.find((e) => e.role === 'DEV') ||
        employeesData.employees[0];
      if (dev) {
        setSelectedDeveloperId(dev.id);
      }
    }
  }, [employeesData, selectedDeveloperId, setSelectedDeveloperId]);

  // Load selected developer's today timesheet & telemetry
  const {
    data: todayData,
    isLoading: isTodayLoading,
    refetch: refetchToday,
  } = useQuery({
    queryKey: ['timesheet-today', selectedDeveloperId],
    queryFn: () => api.getTodayTimesheet(selectedDeveloperId || undefined),
    enabled: !!selectedDeveloperId,
  });

  // Load all projects so we can offer Core, Neo, and Bench
  const { data: marginData } = useQuery({
    queryKey: ['margin-summary'],
    queryFn: () => api.getMarginSummary(),
  });

  // Local interactive allocation sliders state
  const [allocations, setAllocations] = useState<ProjectAllocationState[]>([]);
  const [submittedBlock, setSubmittedBlock] = useState<LogEffortResponse | null>(null);

  // Sync allocations when todayData loads or developer changes
  useEffect(() => {
    if (!todayData || !marginData) return;

    const physicalHours = todayData.physicalHoursToday > 0 ? todayData.physicalHoursToday : 8.0;

    // We want 3 projects: PRJ-SBI-CORE, PRJ-SBI-NEO, PRJ-BENCH
    const corePrj = marginData.projects.find((p) => p.projectCode === 'PRJ-SBI-CORE');
    const neoPrj = marginData.projects.find((p) => p.projectCode === 'PRJ-SBI-NEO');
    const benchPrj = marginData.projects.find((p) => p.projectCode === 'PRJ-BENCH');

    // Default distribution: 60% Core, 25% Neo, 15% Bench
    const initialList: ProjectAllocationState[] = [
      {
        projectId: corePrj?.projectId || 'prj-core',
        projectCode: 'PRJ-SBI-CORE',
        projectName: 'SBI Shinsei Core Banking Modernization',
        percentage: 60,
        hours: Number(((60 / 100) * physicalHours).toFixed(1)),
        taskDescription: 'Core Banking API refactor & transaction deadlocks stress testing',
        taskType: 'DEV',
        isBillable: true,
      },
      {
        projectId: neoPrj?.projectId || 'prj-neo',
        projectCode: 'PRJ-SBI-NEO',
        projectName: 'SBI NeoMobile Securities Microservices',
        percentage: 25,
        hours: Number(((25 / 100) * physicalHours).toFixed(1)),
        taskDescription: 'Trade order gateway Kafka stream consumer tuning',
        taskType: 'CODE_REVIEW',
        isBillable: true,
      },
      {
        projectId: benchPrj?.projectId || 'prj-bench',
        projectCode: 'PRJ-BENCH',
        projectName: 'Internal R&D & Bench Training',
        percentage: 15,
        hours: Number(((15 / 100) * physicalHours).toFixed(1)),
        taskDescription: 'FISC Banking Security Guidelines & Clean Code Workshop',
        taskType: 'ODC_SECURITY_TRAINING',
        isBillable: false,
      },
    ];

    setAllocations(initialList);
    setSubmittedBlock(null);
  }, [todayData, marginData, selectedDeveloperId]);

  const physicalHours = todayData?.physicalHoursToday && todayData.physicalHoursToday > 0
    ? todayData.physicalHoursToday
    : 8.0;

  // Handle slider drag
  const handleSliderChange = (index: number, newPercentage: number) => {
    setAllocations((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.percentage = newPercentage;
      target.hours = Number(((newPercentage / 100) * physicalHours).toFixed(1));
      updated[index] = target;
      return updated;
    });
  };

  // Handle task description / task type changes
  const handleFieldChange = (
    index: number,
    field: 'taskDescription' | 'taskType' | 'isBillable',
    value: any
  ) => {
    setAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Normalize to 100%
  const handleNormalize = () => {
    const currentTotal = allocations.reduce((sum, a) => sum + a.percentage, 0);
    if (currentTotal === 0) return;

    setAllocations((prev) => {
      return prev.map((item) => {
        const normalizedPct = Math.round((item.percentage / currentTotal) * 100);
        return {
          ...item,
          percentage: normalizedPct,
          hours: Number(((normalizedPct / 100) * physicalHours).toFixed(1)),
        };
      });
    });

    addToast({
      type: 'info',
      title: 'Effort Normalized',
      message: `Scaled total allocation to match 100% (${physicalHours}h physical presence).`,
    });
  };

  // Total allocated percentage and hours
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const totalHours = Number(allocations.reduce((sum, a) => sum + a.hours, 0).toFixed(1));
  const deltaHours = Number((totalHours - physicalHours).toFixed(1));
  const isCompliant = Math.abs(deltaHours) <= 0.5;

  // Submit Timesheet Mutation
  const submitTimesheetMutation = useMutation({
    mutationFn: () => {
      if (!todayData?.user?.id) throw new Error('No user selected');
      return api.logEffort({
        userId: todayData.user.id,
        date: todayData.date || new Date().toISOString().slice(0, 10),
        allocations: allocations.map((a) => ({
          projectId: a.projectId,
          hours: a.hours,
          taskDescription: a.taskDescription || `${a.projectCode} task`,
          taskType: a.taskType,
          isBillable: a.isBillable,
        })),
      });
    },
    onSuccess: (res) => {
      setSubmittedBlock(res);
      addToast({
        type: 'success',
        title: 'Timesheet Sealed in Audit Chain',
        message: `Block #${res.auditBlockSequence} cryptographically anchored (SHA-256: ${res.blockHash.slice(0, 16)}...).`,
        duration: 7000,
      });
      // Invalidate queries so tables refresh instantly
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['odc-reconcile'] });
      queryClient.invalidateQueries({ queryKey: ['margin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-proof-pack'] });
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Failed to Submit Timesheet',
        message: String(err),
      });
    },
  });

  const latestSwipe = todayData?.todaySwipes?.[0];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Employee Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Developer UX Innovation
            </span>
            <span className="text-xs text-slate-400 font-mono">
              FISC Compliant 10-Second Time Accounting
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Developer 10-Second Smart Effort Allocation Slider
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Seamlessly allocate your daily physical presence across active projects with visual sliders. 
            Zero friction, automatically aligned with turnstile badge swipes, and sealed with a tamper-proof SHA-256 block.
          </p>
        </div>

        {/* Developer Simulation Switcher */}
        <div className="p-3 rounded-xl bg-navy-950/80 border border-navy-800 flex items-center gap-3 shrink-0">
          <User className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Simulate Developer Account
            </label>
            <select
              value={selectedDeveloperId}
              onChange={(e) => setSelectedDeveloperId(e.target.value)}
              className="mt-0.5 bg-navy-850 border border-navy-700 text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
            >
              {employeesData?.employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role} - {emp.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live ODC Badge Telemetry Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={todayData?.user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                alt={todayData?.user?.name || 'Developer'}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-navy-900 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {todayData?.user?.name || 'Loading developer...'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-navy-800 text-cyan-300 border border-cyan-500/30">
                  {todayData?.user?.role || 'DEV'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-navy-850">
                  RFID: {todayData?.user?.odcCardId || 'ODC-004'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {todayData?.user?.department || 'Delivery Unit 1'} · Rate: ${todayData?.user?.billingRatePerHour}/h · Cost: ${todayData?.user?.costRatePerHour}/h
              </p>
            </div>
          </div>

          {/* Real-time Telemetry Stats */}
          <div className="flex items-center gap-3 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-navy-800 font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">ODC Room</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {latestSwipe?.roomCode || 'ODC-ROOM-7A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">First Entry</div>
              <div className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">
                {latestSwipe ? new Date(latestSwipe.swipeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30 JST'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Last Exit</div>
              <div className="font-bold text-cyan-500 dark:text-cyan-400 text-sm">
                {latestSwipe?.swipeOut ? new Date(latestSwipe.swipeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '17:30 JST'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950 to-navy-900 border border-cyan-500/40 text-right">
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                Physical Presence
              </div>
              <div className="text-lg font-black text-white font-mono">
                {physicalHours.toFixed(1)} hrs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Block Confirmation Banner (if submitted) */}
      {submittedBlock && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 animate-fade-in shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  Timesheet Successfully Sealed in Cryptographic Audit Block #{submittedBlock.auditBlockSequence}
                </div>
                <div className="text-xs text-slate-300 font-mono mt-0.5 break-all">
                  SHA-256 Anchor: <span className="text-cyan-300">{submittedBlock.blockHash}</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 self-start sm:self-center">
              FISC / J-SOX 404 IMMUTABLE
            </span>
          </div>
        </div>
      )}

      {/* Effort Allocation Sliders Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              10-Second Effort Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag the sliders below to distribute your {physicalHours} hours of physical ODC attendance.
            </p>
          </div>

          {/* Normalize Button & Total Gauge */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleNormalize}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-750 text-slate-800 dark:text-cyan-300 border border-slate-300 dark:border-navy-700 transition-colors"
              title="Scale total allocations to exactly 100% of physical presence"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Normalize to 100% ({physicalHours}h)
            </button>

            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${
                isCompliant
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <span>Total: {totalPercentage}%</span>
              <span>({totalHours}h / {physicalHours}h)</span>
              {isCompliant ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
        </div>

        {/* Project Sliders List */}
        <div className="space-y-6">
          {allocations.map((item, index) => (
            <div
              key={item.projectId}
              className="p-4 rounded-xl bg-slate-50 dark:bg-navy-850/60 border border-slate-200 dark:border-navy-800/80 hover:border-cyan-500/30 transition-all space-y-3"
            >
              {/* Header: Project name, percentage, hours */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-navy-800 text-cyan-400 border border-cyan-500/30">
                    {item.projectCode}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {item.projectName}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Allocated:
                  </span>
                  <span className="font-bold text-base text-cyan-500 dark:text-cyan-400">
                    {item.percentage}%
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {item.hours.toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {/* Visual Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={item.percentage}
                  onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-navy-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (0.0h)</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100% ({physicalHours}h)</span>
                </div>
              </div>

              {/* Task Description & Task Type Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    value={item.taskDescription}
                    onChange={(e) => handleFieldChange(index, 'taskDescription', e.target.value)}
                    placeholder="Describe tasks completed..."
                    className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={item.taskType}
                    onChange={(e) => handleFieldChange(index, 'taskType', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="DEV">DEV (Development)</option>
                    <option value="CODE_REVIEW">CODE_REVIEW (Peer Review)</option>
                    <option value="MEETING">MEETING (Governance)</option>
                    <option value="ODC_SECURITY_TRAINING">ODC_SECURITY_TRAINING</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={item.isBillable}
                      onChange={(e) => handleFieldChange(index, 'isBillable', e.target.checked)}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                      Billable
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Submission Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>
              Submitting triggers automatic cryptographic SHA-256 hash sealing into J-SOX audit ledger.
            </span>
          </div>

          <button
            onClick={() => submitTimesheetMutation.mutate()}
            disabled={submitTimesheetMutation.isPending || totalHours === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/40 border border-cyan-400/40 transition-all disabled:opacity-50 active:scale-95"
          >
            <Send
              className={`w-4 h-4 ${
                submitTimesheetMutation.isPending ? 'animate-bounce' : ''
              }`}
            />
            <span>
              {submitTimesheetMutation.isPending
                ? 'Sealing Cryptographic Timesheet...'
                : 'Submit & Seal Timesheet in J-SOX Ledger'}
            </span>
          </button>
        </div>
      </div>

      {/* Today's Existing Timesheet Entries */}
      {todayData?.todayEntries && todayData.todayEntries.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Previously Submitted Entries for Today ({todayData.date})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-navy-800 font-mono text-xs">
            {todayData.todayEntries.map((entry) => (
              <div
                key={entry.id}
                className="py-2.5 flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-cyan-500 dark:text-cyan-400">
                    {entry.project?.code || 'PRJ'}
                  </span>
                  <span className="font-sans text-xs">{entry.taskDescription}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {entry.hours}h
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      entry.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : entry.status === 'FLAGGED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
