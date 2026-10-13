import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, EmployeeWithAssignedProjects } from '../lib/api';
import { useStore } from '../store/useStore';
import {
  Users,
  Search,
  Filter,
  CreditCard,
  Lock,
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
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Đang tải danh bạ nhân sự &amp; ma trận phân quyền ODC...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <h3 className="font-bold text-sm mb-1">Không thể tải danh sách nhân sự</h3>
        <p>{String(error || 'Không có dữ liệu')}</p>
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
    <div className="space-y-5">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Danh Bạ Nhân Sự &amp; Ma Trận Phân Quyền Thẻ ODC</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý 10 kỹ sư chứng chỉ FISC, đơn giá xuất khẩu (Billing Rate), chi phí vốn và quyền mở cửa phòng Cleanroom.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
            <span>Tổng nhân sự:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{employees.length} Kỹ sư</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, mã thẻ RFID, phòng ban..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò ({employees.length})</option>
            <option value="EXECUTIVE">Executive (Lãnh đạo)</option>
            <option value="PM">Project Manager (Quản trị)</option>
            <option value="DEV">Developer (Kỹ sư)</option>
            <option value="AUDITOR">Auditor (Kiểm toán)</option>
          </select>
        </div>
      </div>

      {/* High-Density Roster Table */}
      <div className="rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Kỹ Sư / Nhân Sự</th>
                <th className="py-3 px-2.5">Vai Trò &amp; Đơn Vị</th>
                <th className="py-3 px-2.5">Thẻ RFID Turnstile</th>
                <th className="py-3 px-2.5">Quyền Cửa Phòng ODC</th>
                <th className="py-3 px-2.5 text-right">Đơn Giá Bán</th>
                <th className="py-3 px-2.5 text-right">Chi Phí Vốn</th>
                <th className="py-3 px-2.5 text-right">Chênh Lệch Lãi</th>
                <th className="py-3 px-3.5">Dự Án Đang Tham Gia</th>
                <th className="py-3 px-2.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filteredEmployees.map((emp) => {
                const rooms = getRoomClearance(emp);

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Employee Profile */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            emp.avatarUrl ||
                            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
                          }
                          alt={emp.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-gray-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3 px-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-gray-700">
                        {emp.role}
                      </span>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {emp.department || 'Delivery Unit 1'}
                      </div>
                    </td>

                    {/* RFID Badge */}
                    <td className="py-3 px-2.5 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{emp.odcCardId || 'N/A'}</span>
                      </div>
                      <div className="text-[9px] text-emerald-600 font-sans">Sinh trắc học OK</div>
                    </td>

                    {/* ODC Clearance */}
                    <td className="py-3 px-2.5">
                      <div className="flex flex-wrap gap-1">
                        {rooms.map((room) => (
                          <span
                            key={room}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-50 dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700"
                          >
                            <Lock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                            {room}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Billing Rate */}
                    <td className="py-3 px-2.5 text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${emp.billingRatePerHour.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/h</span>
                    </td>

                    {/* Cost Rate */}
                    <td className="py-3 px-2.5 text-right font-mono">
                      <span className="text-slate-600 dark:text-slate-400">
                        ${emp.costRatePerHour.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/h</span>
                    </td>

                    {/* Margin Spread */}
                    <td className="py-3 px-2.5 text-right font-mono">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        +${emp.marginPerHour.toFixed(2)}/h
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {emp.billingRatePerHour > 0
                          ? `${((emp.marginPerHour / emp.billingRatePerHour) * 100).toFixed(0)}% margin`
                          : 'Chi phí chung'}
                      </div>
                    </td>

                    {/* Assigned Projects */}
                    <td className="py-3 px-3.5 font-mono text-[11px]">
                      {emp.assignedProjects.length > 0 ? (
                        <div className="space-y-0.5">
                          {emp.assignedProjects.map((p) => (
                            <div
                              key={p.projectId}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {p.code}
                              </span>
                              <span className="text-slate-400 text-[10px]">
                                {p.allocatedPercentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans text-xs italic">
                          Chưa phân bổ
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2.5 text-center">
                      <button
                        onClick={() => handleSimulateUser(emp.id)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 shadow-2xs transition-colors"
                        title="Giả lập nhân viên này trong thanh trượt công 10s"
                      >
                        Giả lập
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
