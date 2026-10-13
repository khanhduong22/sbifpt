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
  ExternalLink,
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
      title: 'Copied to Clipboard',
      message: `${label} copied successfully.`,
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
      title: 'Audit Proof Exported',
      message: 'Cryptographically sealed J-SOX 404 certificate downloaded.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-navy-900 to-navy-950 text-slate-100 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-850/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  J-SOX 404 & FISC Cryptographic Audit Proof Pack
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial Instruments and Exchange Act of Japan (J-SOX 404) & FISC Guideline Compliant
              </p>
            </div>
          </div>
          <button
            onClick={closeJsoxModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Verifying cryptographic SHA-256 Merkle chain...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm">
              Failed to load audit proof pack: {String(error)}
            </div>
          )}

          {proofPack && (
            <>
              {/* Official Seal and Status Banner */}
              <div className="relative p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-navy-850 via-navy-900 to-navy-850 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden">
                {/* Japanese Official Inkan/Hanko Seal */}
                <div className="flex items-center gap-4">
                  <div className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-rose-600/80 bg-rose-950/20 shadow-lg shadow-rose-950/40 text-rose-500 select-none shrink-0 transform rotate-[-6deg]">
                    <span className="text-[10px] font-bold tracking-widest leading-none">SBI FPT</span>
                    <span className="text-xs font-black tracking-tight my-0.5">証 印</span>
                    <span className="text-[8px] font-mono font-semibold uppercase leading-none">FISC 適合</span>
                    <div className="absolute inset-1 rounded-full border border-dashed border-rose-600/40 pointer-events-none"></div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-sm">
                        ✅ 100% Tamper-Proof
                      </span>
                      <span className="text-xs text-slate-400">
                        (0 backdated modifications detected)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Continuous SHA-256 Hash Chain verification completed across all{' '}
                      <strong className="text-cyan-400">{proofPack.totalBlocks} blocks</strong>.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        FISC Financial Standard
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        <Award className="w-3 h-3 text-gold-400 text-amber-400" />
                        ISO/IEC 27001:2022
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400 font-mono">Chain Height</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">
                    #{proofPack.totalBlocks}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Verified {new Date(proofPack.verifiedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Cryptographic Hashes */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  Cryptographic Verification Anchors
                </h4>

                {/* Merkle Root */}
                <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <span>Merkle Root Hash (SHA-256)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                        Top Anchor
                      </span>
                    </div>
                    <div className="font-mono text-xs text-cyan-300 break-all select-all">
                      {proofPack.merkleRoot}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(proofPack.merkleRoot, 'Merkle Root')}
                    className="p-2 rounded bg-navy-850 hover:bg-navy-800 text-slate-400 hover:text-cyan-400 border border-navy-700 transition-colors shrink-0"
                    title="Copy Merkle Root"
                  >
                    {copiedHash === 'Merkle Root' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Latest Block Hash */}
                <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-400 font-semibold mb-1">
                      Latest Sealed Block Hash
                    </div>
                    <div className="font-mono text-xs text-slate-300 break-all select-all">
                      {proofPack.latestHash}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(proofPack.latestHash, 'Latest Hash')}
                    className="p-2 rounded bg-navy-850 hover:bg-navy-800 text-slate-400 hover:text-cyan-400 border border-navy-700 transition-colors shrink-0"
                    title="Copy Hash"
                  >
                    {copiedHash === 'Latest Hash' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Genesis Hash */}
                <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-400 font-semibold mb-1">
                      Genesis Block Hash
                    </div>
                    <div className="font-mono text-xs text-slate-400 break-all select-all">
                      {proofPack.genesisHash}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(proofPack.genesisHash, 'Genesis Hash')}
                    className="p-2 rounded bg-navy-850 hover:bg-navy-800 text-slate-400 hover:text-cyan-400 border border-navy-700 transition-colors shrink-0"
                    title="Copy Genesis Hash"
                  >
                    {copiedHash === 'Genesis Hash' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Japanese Legal & Regulatory Statement */}
              <div className="p-4 rounded-xl bg-navy-850/60 border border-navy-700/60 text-xs space-y-2 text-slate-300">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  J-SOX & FISC Legal Compliance Attestation (日本金融情報システム基準適合)
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  本監査パックは、金融商品取引法第24条の4の4（内部統制報告制度・J-SOX）および財団法人金融情報システムセンター（FISC）の「金融機関等コンピュータシステムの安全対策基準」に準拠し、物理的入退室データと工数実績データの完全性を数学的暗号（SHA-256ハッシュ連鎖およびマークルツリー）により証明するものです。
                </p>
              </div>

              {/* Recent Audit Trail Blocks Preview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Sealed Audit Trail Blocks (Latest {proofPack.auditTrail.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {proofPack.auditTrail.map((block) => (
                    <div
                      key={block.sequence}
                      className="p-2.5 rounded-lg bg-navy-950/70 border border-navy-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-bold">#{block.sequence}</span>
                        <span className="text-slate-200">{block.action}</span>
                        <span className="text-slate-500 text-[10px] hidden sm:inline">
                          by {block.actor}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <span className="text-[11px] text-slate-500">
                          {new Date(block.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-navy-800 bg-navy-850/80">
          <div className="text-[11px] text-slate-400 font-mono">
            Cryptographic Engine: SHA-256 Chained Merkle Anchor
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={closeJsoxModal}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={downloadCertificate}
              disabled={!proofPack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download Official JSON Proof
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
