import { createHash, randomUUID } from 'node:crypto';
import { AuditEntryRecord, ChainVerificationResult } from './types';

/**
 * Standard 64-character zero-string representing the genesis block
 */
export const GENESIS_HASH = '0'.repeat(64);

/**
 * Deterministically stringify JSON by sorting object keys recursively.
 * Ensures consistent hash generation regardless of JavaScript key insertion order.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonStringify(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(
    (key) =>
      `${JSON.stringify(key)}:${canonicalJsonStringify((value as Record<string, unknown>)[key])}`
  );

  return `{${pairs.join(',')}}`;
}

/**
 * Format timestamp into standard ISO string
 */
export function normalizeTimestamp(ts: string | Date | number): string {
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return new Date(ts).toISOString();
}

export function canonicalizeJson(input: string | Record<string, unknown> | unknown): string {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return canonicalJsonStringify(parsed);
    } catch {
      return input;
    }
  }
  return canonicalJsonStringify(input);
}

/**
 * Compute SHA-256 hash string for an audit log entry
 * Formula: SHA256(previousHash + ":" + sequence + ":" + isoTimestamp + ":" + action + ":" + actorId + ":" + payload)
 */
export function computeAuditHash(params: {
  previousHash: string;
  sequence: number;
  timestamp: string | Date | number;
  action: string;
  actorId?: string | null;
  detailsJson: string | Record<string, unknown>;
}): string {
  const tsStr = normalizeTimestamp(params.timestamp);
  const payloadStr = canonicalizeJson(params.detailsJson);
  const actorIdStr = params.actorId ?? 'SYSTEM';

  const rawData = [
    params.previousHash,
    params.sequence.toString(),
    tsStr,
    params.action,
    actorIdStr,
    payloadStr,
  ].join(':');

  return createHash('sha256').update(rawData).digest('hex');
}

/**
 * Verify cryptographic integrity of an entire sequence of audit log entries
 */
export function verifyAuditChain(
  entries: AuditEntryRecord[],
  expectedGenesisHash: string = GENESIS_HASH
): ChainVerificationResult {
  if (!entries || entries.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      verifiedBlocks: 0,
    };
  }

  // Sort by sequence to ensure proper order
  const sorted = [...entries].sort((a, b) => a.sequence - b.sequence);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Check 1: Sequence continuity
    if (i > 0 && current.sequence !== sorted[i - 1].sequence + 1) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        verifiedBlocks: i,
        errorIndex: i,
        errorReason: `Sequence break at index ${i}: expected ${sorted[i - 1].sequence + 1}, got ${current.sequence}`,
      };
    }

    // Check 2: Chaining to previous block
    const expectedPreviousHash = i === 0 ? expectedGenesisHash : sorted[i - 1].currentHash;
    if (current.previousHash !== expectedPreviousHash) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        verifiedBlocks: i,
        errorIndex: i,
        errorReason: `Hash link broken at sequence ${current.sequence}: expected previousHash ${expectedPreviousHash.slice(0, 12)}..., got ${current.previousHash.slice(0, 12)}...`,
      };
    }

    // Check 3: Current hash verification against content
    const recomputedHash = computeAuditHash({
      previousHash: current.previousHash,
      sequence: current.sequence,
      timestamp: current.timestamp,
      action: current.action,
      actorId: current.actorId,
      detailsJson: current.detailsJson,
    });

    if (current.currentHash !== recomputedHash) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        verifiedBlocks: i,
        errorIndex: i,
        errorReason: `Hash mismatch at sequence ${current.sequence}: stored hash ${current.currentHash.slice(0, 12)}... does not match recalculated content hash ${recomputedHash.slice(0, 12)}... (Tampering detected!)`,
      };
    }
  }

  return {
    isValid: true,
    totalBlocks: sorted.length,
    verifiedBlocks: sorted.length,
  };
}
