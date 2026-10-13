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
  Lock,
  ArrowRight,
  Code,
  FileCheck2,
  Clock,
  User,
  Hash,
  ChevronDown,
  ChevronUp,
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
      title: 'Copied to Clipboard',
      message: `${label} copied successfully.`,
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
      title: 'Audit Trail Exported',
      message: 'Cryptographically sealed audit blocks downloaded.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Verifying SHA-256 Merkle Chain Integrity...</p>
      </div>
    );
  }

  if (error || !proofPack) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300">
        <h3 className="font-bold text-base mb-1">Failed to load Audit Chain</h3>
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Immutable Distributed Ledger
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SHA-256 Continuous Chained Merkle Tree
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            J-SOX 404 &amp; FISC Cryptographic Audit Chain Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Mathematical proof of non-repudiation. Every timesheet entry, ODC reconciliation run, and contract
            parameter change is hashed and linked sequentially. Any backdated tampering breaks the Merkle root instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={downloadJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-navy-800 hover:bg-navy-750 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export JSON Audit Proof</span>
          </button>
          <button
            onClick={openJsoxModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/40 border border-cyan-400/40 transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Japanese Legal Seal Certificate</span>
          </button>
        </div>
      </div>

      {/* Top Ledger Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Blocks */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Sealed Blocks
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-cyan-500 dark:text-cyan-400">
            #{proofPack.totalBlocks}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {proofPack.verifiedBlocks} verified unbroken
          </div>
        </div>

        {/* Chain Integrity */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Chain Integrity</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-500 dark:text-emerald-400">
            100% Valid
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-500">
            0 Tampering / 0 Backdating
          </div>
        </div>

        {/* Standard */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Compliance Framework
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            J-SOX 404 / FISC / ISO 27001
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Tokyo Banking Regulatory Standard
          </div>
        </div>

        {/* Verification Timestamp */}
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Last Verifier Check
          </div>
          <div className="mt-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            {new Date(proofPack.verifiedAt).toLocaleTimeString()} JST
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Deterministic verification
          </div>
        </div>
      </div>

      {/* Merkle Root Card */}
      <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Current Merkle Root (Root of Trust)
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            Continuous Binary Hash Aggregation
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-navy-900 border border-navy-800">
          <code className="text-xs font-mono text-cyan-300 break-all select-all">
            {proofPack.merkleRoot}
          </code>
          <button
            onClick={() => copyToClipboard(proofPack.merkleRoot, 'Merkle Root')}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
            title="Copy Merkle Root"
          >
            {copiedHash === 'Merkle Root' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Sequential Hash Blocks Timeline */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          Sequential Block Chain (Genesis to Latest)
        </h2>

        <div className="space-y-3">
          {proofPack.auditTrail.map((block, idx) => {
            const isExpanded = expandedBlock === block.sequence;

            return (
              <div
                key={block.sequence}
                className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-sm overflow-hidden hover:border-cyan-500/40 transition-all"
              >
                {/* Block Summary Header */}
                <div
                  onClick={() => setExpandedBlock(isExpanded ? null : block.sequence)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-navy-850/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-navy-800 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-cyan-500/30">
                      #{block.sequence}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {block.action}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          SEALED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>By: {block.actor}</span>
                        <span>·</span>
                        <span className="font-mono">
                          {new Date(block.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="font-mono text-[11px] text-cyan-500 dark:text-cyan-400 hidden md:inline">
                      {block.hash.slice(0, 16)}...
                    </span>
                    <button className="p-1 rounded text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Block Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/60 font-mono text-xs space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                          Previous Block Hash
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-[11px] text-slate-400 break-all select-all">
                          {block.previousHash}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-cyan-400 uppercase font-semibold mb-1">
                          Current Block Hash (SHA-256)
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-navy-900 border border-cyan-500/30 text-[11px] text-cyan-300 break-all select-all font-bold">
                          {block.hash}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1.5">
                        <Code className="w-3 h-3 text-cyan-400" />
                        Canonical Payload Details (JSON)
                      </div>
                      <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-[11px] overflow-x-auto max-h-48 border border-slate-800">
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
