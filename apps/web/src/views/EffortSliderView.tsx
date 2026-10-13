import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, LogEffortResponse } from '../lib/api';
import { useStore } from '../store/useStore';
import { TaskType } from '@sbifpt/shared';
import {
  Sliders,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Building,
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

  // Load all projects
  const { data: marginData } = useQuery({
    queryKey: ['margin-summary'],
    queryFn: () => api.getMarginSummary(),
  });

  const [allocations, setAllocations] = useState<ProjectAllocationState[]>([]);
  const [submittedBlock, setSubmittedBlock] = useState<LogEffortResponse | null>(null);

  // Sync allocations when todayData loads or developer changes
  useEffect(() => {
    if (!todayData || !marginData) return;

    const physicalHours = todayData.physicalHoursToday > 0 ? todayData.physicalHoursToday : 8.0;

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

  const physicalHours =
    todayData?.physicalHoursToday && todayData.physicalHoursToday > 0
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
      title: 'Đã chuẩn hoá 100%',
      message: `Đã căn chỉnh tổng tỷ lệ khớp đúng 100% (${physicalHours}h hiện diện thực tế).`,
    });
  };

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
        title: 'Bảng Công Đã Niêm Phong Vào Sổ Cái J-SOX',
        message: `Khối #${res.auditBlockSequence} đã được neo mật mã SHA-256 (${res.blockHash.slice(0, 16)}...).`,
        duration: 7000,
      });
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['odc-reconcile'] });
      queryClient.invalidateQueries({ queryKey: ['margin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-proof-pack'] });
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Lỗi nộp bảng công',
        message: String(err),
      });
    },
  });

  const latestSwipe = todayData?.todaySwipes?.[0];

  return (
    <div className="space-y-5">
      {/* Enterprise Page Header with Developer Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Thanh Trượt Phân Bổ Công Việc 10s (Smart Effort Slider)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân bổ giờ làm việc theo thời gian thực quẹt thẻ Turnstile. Không còn áp lực nhớ giờ, tự động neo khối mật mã J-SOX.
          </p>
        </div>

        {/* Developer Switcher Dropdown */}
        <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 shadow-2xs">
          <User className="w-4 h-4 text-slate-500" />
          <span className="text-[11px] font-medium text-slate-500">Giả lập:</span>
          <select
            value={selectedDeveloperId}
            onChange={(e) => setSelectedDeveloperId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {employeesData?.employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role} - {emp.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Turnstile RFID Presence Telemetry Banner */}
      <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  todayData?.user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
                }
                alt={todayData?.user?.name || 'Developer'}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-gray-700"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {todayData?.user?.name || 'Đang tải nhân sự...'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                  {todayData?.user?.role || 'DEV'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  RFID: {todayData?.user?.odcCardId || 'ODC-004'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {todayData?.user?.department || 'Delivery Unit 1'} · Rate: ${todayData?.user?.billingRatePerHour}/h · Cost: ${todayData?.user?.costRatePerHour}/h
              </p>
            </div>
          </div>

          {/* Turnstile Telemetry Badges */}
          <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-gray-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-sans font-medium">Phòng ODC</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                {latestSwipe?.roomCode || 'ODC-ROOM-7A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-sans font-medium">Giờ Vào Cổng</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                {latestSwipe
                  ? new Date(latestSwipe.swipeIn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '08:30'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-sans font-medium">Giờ Ra Cổng</div>
              <div className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                {latestSwipe?.swipeOut
                  ? new Date(latestSwipe.swipeOut).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '17:30'}
              </div>
            </div>

            <div className="pl-3 border-l border-slate-200 dark:border-gray-800">
              <div className="text-[10px] text-slate-500 font-sans font-medium">Hiện diện thực tế</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {physicalHours.toFixed(1)} hrs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Sealed Block Confirmation (if submitted) */}
      {submittedBlock && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  Đã niêm phong bảng công vào Khối Sổ Cái J-SOX #{submittedBlock.auditBlockSequence}
                </div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 break-all">
                  SHA-256 Hash: {submittedBlock.blockHash}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 shrink-0">
              FISC J-SOX 404 IMMUTABLE
            </span>
          </div>
        </div>
      )}

      {/* Main Sliders Card Container */}
      <div className="p-4 sm:p-5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs space-y-4">
        {/* Toolbar: Title, Normalize Button & Total Gauge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Phân Bổ Tỷ Trọng Công Việc</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Kéo thanh trượt để chia {physicalHours} giờ làm việc thực tế cho các dự án.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleNormalize}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:border-gray-700 transition-colors"
              title="Cân bằng tổng tỷ lệ về đúng 100%"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Cân bằng 100% ({physicalHours}h)</span>
            </button>

            <div
              className={`px-3 py-1 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 ${
                isCompliant
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
              }`}
            >
              <span>Tổng: {totalPercentage}%</span>
              <span>({totalHours}h / {physicalHours}h)</span>
              {isCompliant ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
          </div>
        </div>

        {/* Sliders List */}
        <div className="space-y-3.5">
          {allocations.map((item, index) => (
            <div
              key={item.projectId}
              className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-800 space-y-2.5"
            >
              {/* Slider Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-gray-700 shadow-2xs">
                    {item.projectCode}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {item.projectName}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-500 font-sans text-[11px]">Tỷ lệ:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {item.percentage}%
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {item.hours.toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {/* Smooth Range Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={item.percentage}
                  onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (0.0h)</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100% ({physicalHours}h)</span>
                </div>
              </div>

              {/* Task Details & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    value={item.taskDescription}
                    onChange={(e) => handleFieldChange(index, 'taskDescription', e.target.value)}
                    placeholder="Mô tả công việc thực hiện..."
                    className="w-full text-xs px-3 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={item.taskType}
                    onChange={(e) => handleFieldChange(index, 'taskType', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="DEV">DEV (Lập trình)</option>
                    <option value="CODE_REVIEW">CODE_REVIEW (Soát mã)</option>
                    <option value="MEETING">MEETING (Họp dự án)</option>
                    <option value="ODC_SECURITY_TRAINING">ODC_TRAINING (Đào tạo)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={item.isBillable}
                      onChange={(e) => handleFieldChange(index, 'isBillable', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                      Tính phí
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Submission Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Nộp bảng công sẽ tự động tạo chữ ký mật mã SHA-256 vào sổ cái FISC.</span>
          </div>

          <button
            onClick={() => submitTimesheetMutation.mutate()}
            disabled={submitTimesheetMutation.isPending || totalHours === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${submitTimesheetMutation.isPending ? 'animate-bounce' : ''}`} />
            <span>
              {submitTimesheetMutation.isPending
                ? 'Đang niêm phong sổ cái...'
                : 'Nộp & Niêm Phong Bảng Công (10s)'}
            </span>
          </button>
        </div>
      </div>

      {/* Today's Existing Timesheet Entries */}
      {todayData?.todayEntries && todayData.todayEntries.length > 0 && (
        <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs space-y-2.5">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Các bản ghi đã nộp hôm nay ({todayData.date})</span>
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-gray-800 font-mono text-xs">
            {todayData.todayEntries.map((entry) => (
              <div
                key={entry.id}
                className="py-2 flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {entry.project?.code || 'PRJ'}
                  </span>
                  <span className="font-sans text-xs truncate">{entry.taskDescription}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {entry.hours}h
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      entry.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : entry.status === 'FLAGGED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
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
