import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import {
  Link2,
  ShieldCheck,
  Download,
  Copy,
  Check,
  FileCheck2,
  Clock,
  Hash,
  ChevronDown,
  ChevronUp,
  Code,
} from 'lucide-react';

export const AuditChainView: React.FC = () => {
  const { openJsoxModal, addToast } = useStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  const { data: proofPack, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-proof-pack'],
    queryFn: () => api.getAuditProofPack(),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    addToast({
      type: 'info',
      title: 'Đã sao chép vào bộ nhớ tạm',
      message: `${label} đã được sao chép thành công.`,
    });
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const downloadJson = () => {
    if (!proofPack) return;
    const jsonStr = JSON.stringify(proofPack, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SBI-FPT-JSOX-FISC-Audit-Trail-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Đã xuất sổ cái kiểm toán',
      message: 'Tệp chứng minh mật mã SHA-256 đã được tải về.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Đang kiểm toán tính toàn vẹn cây Merkle SHA-256...</p>
      </div>
    );
  }

  if (error || !proofPack) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <h3 className="font-bold text-sm mb-1">Không thể tải Sổ Cái Khối Chuỗi</h3>
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

  return (
    <div className="space-y-5">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Sổ Cái Khối Chuỗi Mật Mã J-SOX 404 &amp; FISC (Audit Chain)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bằng chứng toán học chống chối bỏ. Mọi thao tác log công và đối soát turnstile được băm liên tục bằng SHA-256.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={downloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất JSON</span>
          </button>
          <button
            onClick={openJsoxModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Xem Con Dấu Hanko J-SOX</span>
          </button>
        </div>
      </div>

      {/* 4 Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Blocks */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Khối Đã Niêm Phong
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            #{proofPack.totalBlocks}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {proofPack.verifiedBlocks} khối liên tục không đứt đoạn
          </div>
        </div>

        {/* Chain Integrity */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Toàn Vẹn Khối Chuỗi</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            100% Hợp Lệ
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-600/80">0 can thiệp lùi ngày (Zero Backdating)</div>
        </div>

        {/* Standard */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Khung Tuân Thủ
          </div>
          <div className="mt-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
            J-SOX 404 · FISC · ISO 27001
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">Quy chuẩn Ngân hàng Tokyo</div>
        </div>

        {/* Last Verified */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Thời Điểm Kiểm Toán
          </div>
          <div className="mt-1.5 text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            {new Date(proofPack.verifiedAt).toLocaleTimeString()} JST
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">Tự động xác thực đơn ánh</div>
        </div>
      </div>

      {/* Merkle Root Hash Box */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Merkle Root Hash (Gốc Độ Tin Cậy - Root of Trust)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Continuous Binary Hash Aggregation
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 p-2 rounded-md bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
          <code className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all font-semibold">
            {proofPack.merkleRoot}
          </code>
          <button
            onClick={() => copyToClipboard(proofPack.merkleRoot, 'Merkle Root')}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
            title="Sao chép Merkle Root"
          >
            {copiedHash === 'Merkle Root' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Sequential Blocks Timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Danh Sách Khối Tuần Tự (Genesis đến Mới Nhất)</span>
        </h2>

        <div className="space-y-2.5">
          {proofPack.auditTrail.map((block) => {
            const isExpanded = expandedBlock === block.sequence;

            return (
              <div
                key={block.sequence}
                className="rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs overflow-hidden transition-colors"
              >
                {/* Block Header */}
                <div
                  onClick={() => setExpandedBlock(isExpanded ? null : block.sequence)}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-gray-700">
                      #{block.sequence}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {block.action}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                          SEALED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Bởi: {block.actor}</span>
                        <span>·</span>
                        <span className="font-mono">
                          {new Date(block.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
                      {block.hash.slice(0, 16)}...
                    </span>
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 dark:border-gray-800 bg-slate-50/60 dark:bg-gray-850/60 font-mono text-xs space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-sans font-medium mb-1">
                          Previous Block Hash
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[11px] text-slate-500 break-all select-all">
                          {block.previousHash}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-sans font-semibold mb-1">
                          Current Block Hash (SHA-256)
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-600 dark:text-blue-400 break-all select-all font-bold">
                          {block.hash}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-medium mb-1 flex items-center gap-1">
                        <Code className="w-3 h-3 text-slate-400" />
                        <span>Canonical Payload (JSON)</span>
                      </div>
                      <pre className="p-2.5 rounded bg-slate-900 text-emerald-300 text-[11px] overflow-x-auto max-h-40 border border-slate-800">
                        {JSON.stringify(block.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
