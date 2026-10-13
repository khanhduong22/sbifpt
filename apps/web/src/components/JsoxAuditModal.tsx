import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import {
  ShieldCheck,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Lock,
  Award,
  Hash,
} from 'lucide-react';

export const JsoxAuditModal: React.FC = () => {
  const { isJsoxModalOpen, closeJsoxModal, addToast } = useStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { data: proofPack, isLoading, error } = useQuery({
    queryKey: ['audit-proof-pack'],
    queryFn: () => api.getAuditProofPack(),
    enabled: isJsoxModalOpen,
  });

  if (!isJsoxModalOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    addToast({
      type: 'info',
      title: 'Đã sao chép vào bộ nhớ tạm',
      message: `${label} đã được sao chép.`,
    });
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const downloadCertificate = () => {
    if (!proofPack) return;
    const jsonStr = JSON.stringify(proofPack, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SBI-FPT-JSOX-FISC-Audit-Certificate-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Đã xuất chứng chỉ',
      message: 'Chứng chỉ mật mã J-SOX 404 đã được tải về máy.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-100 shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-850/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  J-SOX 404 &amp; FISC Cryptographic Audit Proof Pack
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chứng chỉ Pháp Lý &amp; Kiểm Soát Nội Bộ Tuân Thủ Tài Chính Nhật Bản
              </p>
            </div>
          </div>
          <button
            onClick={closeJsoxModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Đang xác thực liên kết chuỗi Merkle SHA-256...</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              Lỗi tải chứng chỉ: {String(error)}
            </div>
          )}

          {proofPack && (
            <>
              {/* Hanko Inkan Seal Banner */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Authentic Japanese Inkan Seal */}
                  <div className="relative flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-600 select-none shrink-0 transform -rotate-6">
                    <span className="text-[9px] font-bold tracking-widest leading-none">SBI FPT</span>
                    <span className="text-xs font-black tracking-tight my-0.5">証 印</span>
                    <span className="text-[7px] font-mono font-semibold uppercase leading-none">FISC 適合</span>
                    <div className="absolute inset-1 rounded-full border border-dashed border-rose-500/50 pointer-events-none" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        ✅ 100% Chống Can Thiệp
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (Zero backdating)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Chuỗi liên tục SHA-256 đã xác minh hợp lệ qua toàn bộ{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {proofPack.totalBlocks} khối
                      </strong>
                      .
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                        <Lock className="w-3 h-3 text-blue-600" />
                        FISC Financial Standard
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                        <Award className="w-3 h-3 text-amber-500" />
                        ISO/IEC 27001:2022
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400 font-mono">Độ cao chuỗi</div>
                  <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    #{proofPack.totalBlocks}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(proofPack.verifiedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Cryptographic Hashes */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  Các Điểm Neo Mật Mã (Cryptographic Anchors)
                </h4>

                {/* Merkle Root */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 font-semibold mb-0.5 flex items-center gap-1.5">
                      <span>Merkle Root Hash (SHA-256)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        Gốc Tin Cậy
                      </span>
                    </div>
                    <div className="font-mono text-xs text-slate-900 dark:text-white break-all select-all font-semibold">
                      {proofPack.merkleRoot}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(proofPack.merkleRoot, 'Merkle Root')}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
                    title="Sao chép"
                  >
                    {copiedHash === 'Merkle Root' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Latest Block Hash */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                      Khối Đã Niêm Phong Gần Nhất
                    </div>
                    <div className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                      {proofPack.latestHash}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(proofPack.latestHash, 'Latest Hash')}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
                    title="Sao chép"
                  >
                    {copiedHash === 'Latest Hash' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Japanese Legal & Regulatory Statement */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  J-SOX &amp; FISC Legal Compliance Attestation (日本金融情報システム基準適合)
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  本監査パックは、金融商品取引法第24条の4の4（内部統制報告制度・J-SOX）および財団法人金融情報システムセンター（FISC）の「金融機関等コンピュータシステムの安全対策基準」に準拠し、物理的入退室データと工数実績データの完全性を数学的暗号（SHA-256ハッシュ連鎖およびマークルツリー）により証明するものです。
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-850/70">
          <div className="text-[11px] text-slate-500 font-mono">
            SHA-256 Chained Merkle Anchor
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={closeJsoxModal}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={downloadCertificate}
              disabled={!proofPack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải JSON Chứng Chỉ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
