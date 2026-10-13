import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, EmployeeWithAssignedProjects } from '../lib/api';
import { useStore } from '../store/useStore';
import {
  Users,
  ShieldCheck,
  CreditCard,
  Building,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  Lock,
  ArrowUpDown,
} from 'lucide-react';

export const ResourceRosterView: React.FC = () => {
  const { setActiveTab, setSelectedDeveloperId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading Resource Roster & Security Access Matrix...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300">
        <h3 className="font-bold text-base mb-1">Failed to load employees</h3>
        <p className="text-sm">{String(error || 'No data')}</p>
      </div>
    );
  }

  const { employees } = data;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.odcCardId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoomClearance = (emp: EmployeeWithAssignedProjects) => {
    if (emp.role === 'EXECUTIVE') {
      return ['ODC-ROOM-7A', 'ODC-ROOM-7B', 'EXECUTIVE-SUITE'];
    }
    if (emp.role === 'AUDITOR') {
      return ['ALL-ODC-ROOMS', 'AUDIT-ARCHIVE'];
    }
    const hasCore = emp.assignedProjects.some((p) => p.code === 'PRJ-SBI-CORE');
    const hasNeo = emp.assignedProjects.some((p) => p.code === 'PRJ-SBI-NEO');
    const rooms = [];
    if (hasCore) rooms.push('ODC-ROOM-7A');
    if (hasNeo) rooms.push('ODC-ROOM-7B');
    if (rooms.length === 0) rooms.push('COMMON-BENCH');
    return rooms;
  };

  const handleSimulateUser = (userId: string) => {
    setSelectedDeveloperId(userId);
    setActiveTab('slider');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Security & Workforce Management
            </span>
            <span className="text-xs text-slate-400 font-mono">
              FISC Physical Turnstile RFID Clearance Matrix
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Resource Roster & ODC Security Access Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Directory of all 10 certified enterprise engineers, bilingual bridge engineers, and project managers.
            Shows billing spreads, cost rates, and physical ODC room turnstile access authorizations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-right font-mono">
            <div className="text-[10px] text-slate-400">Total Personnel</div>
            <div className="text-lg font-bold text-cyan-400">{employees.length} Certified Staff</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, RFID card, or department..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Roles ({employees.length})</option>
            <option value="EXECUTIVE">Executive</option>
            <option value="PM">Project Manager</option>
            <option value="DEV">Developer</option>
            <option value="AUDITOR">Auditor</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-850/90 border-b border-slate-200 dark:border-navy-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Role &amp; DU</th>
                <th className="py-3 px-3">RFID Badge</th>
                <th className="py-3 px-3">ODC Room Clearance</th>
                <th className="py-3 px-3 text-right">Billing Rate</th>
                <th className="py-3 px-3 text-right">Cost Rate</th>
                <th className="py-3 px-3 text-right">Margin Spread</th>
                <th className="py-3 px-4">Allocated Projects</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-navy-800">
              {filteredEmployees.map((emp) => {
                const rooms = getRoomClearance(emp);

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-navy-850/50 transition-colors"
                  >
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                          alt={emp.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-navy-700 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-navy-800 text-cyan-300 border border-cyan-500/20">
                        {emp.role}
                      </span>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {emp.department || 'Delivery Unit 1'}
                      </div>
                    </td>

                    {/* RFID Badge */}
                    <td className="py-3.5 px-3 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{emp.odcCardId || 'N/A'}</span>
                      </div>
                      <div className="text-[9px] text-emerald-500 font-sans">
                        Biometric Paired
                      </div>
                    </td>

                    {/* ODC Clearance */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {rooms.map((room) => (
                          <span
                            key={room}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-navy-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-750"
                          >
                            <Lock className="w-2.5 h-2.5 text-cyan-400" />
                            {room}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Billing Rate */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${emp.billingRatePerHour.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/h</span>
                    </td>

                    {/* Cost Rate */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="text-slate-600 dark:text-slate-400">
                        ${emp.costRatePerHour.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/h</span>
                    </td>

                    {/* Margin Spread */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="font-extrabold text-emerald-500 dark:text-emerald-400">
                        +${emp.marginPerHour.toFixed(2)}/h
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {emp.billingRatePerHour > 0
                          ? `${((emp.marginPerHour / emp.billingRatePerHour) * 100).toFixed(0)}% margin`
                          : 'Overhead'}
                      </div>
                    </td>

                    {/* Assigned Projects */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {emp.assignedProjects.length > 0 ? (
                        <div className="space-y-1">
                          {emp.assignedProjects.map((p) => (
                            <div key={p.projectId} className="flex items-center justify-between gap-2">
                              <span className="text-cyan-500 dark:text-cyan-400 font-semibold">
                                {p.code}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                                {p.allocatedPercentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans text-xs italic">
                          No active allocation
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleSimulateUser(emp.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-navy-800 hover:bg-navy-700 text-cyan-300 border border-cyan-500/30 transition-colors"
                        title="Simulate this employee in 10s Effort Slider"
                      >
                        Simulate
                      </button>
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
