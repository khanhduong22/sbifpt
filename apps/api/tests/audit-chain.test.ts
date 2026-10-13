import { describe, expect, it } from 'vitest';
import {
  computeAuditHash,
  GENESIS_HASH,
  MerkleTree,
  verifyAuditChain,
  AuditEntryRecord,
} from '@sbifpt/audit-trail';

describe('Cryptographic Audit Trail & Merkle Tree', () => {
  it('correctly creates a valid SHA-256 chained sequence from GENESIS_HASH', () => {
    const timestamp = new Date('2026-04-01T08:00:00Z');

    // Block 1
    const hash1 = computeAuditHash({
      previousHash: GENESIS_HASH,
      sequence: 1,
      timestamp,
      action: 'SYSTEM_INIT',
      actorId: 'user_001',
      detailsJson: { environment: 'Tokyo-DC' },
    });

    const block1: AuditEntryRecord = {
      id: 'blk_1',
      sequence: 1,
      timestamp,
      action: 'SYSTEM_INIT',
      actorId: 'user_001',
      detailsJson: { environment: 'Tokyo-DC' },
      previousHash: GENESIS_HASH,
      currentHash: hash1,
    };

    // Block 2
    const hash2 = computeAuditHash({
      previousHash: hash1,
      sequence: 2,
      timestamp: new Date('2026-04-01T09:00:00Z'),
      action: 'CONTRACT_SIGNED',
      actorId: 'user_001',
      detailsJson: { client: 'SBI Shinsei Bank' },
    });

    const block2: AuditEntryRecord = {
      id: 'blk_2',
      sequence: 2,
      timestamp: new Date('2026-04-01T09:00:00Z'),
      action: 'CONTRACT_SIGNED',
      actorId: 'user_001',
      detailsJson: { client: 'SBI Shinsei Bank' },
      previousHash: hash1,
      currentHash: hash2,
    };

    const result = verifyAuditChain([block1, block2], GENESIS_HASH);
    expect(result.isValid).toBe(true);
    expect(result.totalBlocks).toBe(2);
    expect(result.verifiedBlocks).toBe(2);
  });

  it('detects tampering immediately if payload or hash is maliciously altered', () => {
    const timestamp = new Date('2026-04-01T08:00:00Z');

    const hash1 = computeAuditHash({
      previousHash: GENESIS_HASH,
      sequence: 1,
      timestamp,
      action: 'TIMESHEET_APPROVED',
      actorId: 'user_002',
      detailsJson: { approvedHours: 8.0 },
    });

    const block1: AuditEntryRecord = {
      id: 'blk_1',
      sequence: 1,
      timestamp,
      action: 'TIMESHEET_APPROVED',
      actorId: 'user_002',
      detailsJson: { approvedHours: 8.0 },
      previousHash: GENESIS_HASH,
      currentHash: hash1,
    };

    const hash2 = computeAuditHash({
      previousHash: hash1,
      sequence: 2,
      timestamp: new Date('2026-04-01T09:00:00Z'),
      action: 'INVOICE_GENERATED',
      actorId: 'user_002',
      detailsJson: { billedAmount: 360.0 },
    });

    const block2: AuditEntryRecord = {
      id: 'blk_2',
      sequence: 2,
      timestamp: new Date('2026-04-01T09:00:00Z'),
      action: 'INVOICE_GENERATED',
      actorId: 'user_002',
      detailsJson: { billedAmount: 360.0 },
      previousHash: hash1,
      currentHash: hash2,
    };

    // Tamper with Block 1 payload: secretly change 8.0 to 12.0 hours
    const tamperedBlock1 = {
      ...block1,
      detailsJson: { approvedHours: 12.0 }, // Malicious alteration!
    };

    const tamperResult = verifyAuditChain([tamperedBlock1, block2], GENESIS_HASH);
    expect(tamperResult.isValid).toBe(false);
    expect(tamperResult.errorReason).toContain('Tampering detected');
  });

  it('builds a cryptographic Merkle Tree and validates Merkle inclusion proofs', () => {
    const leaves = [
      'a'.repeat(64),
      'b'.repeat(64),
      'c'.repeat(64),
      'd'.repeat(64),
    ];

    const tree = new MerkleTree(leaves);
    const root = tree.getRoot();

    expect(root).toBeDefined();
    expect(root.length).toBe(64);

    // Generate and verify proof for leaf index 2 ('c'...)
    const proof = tree.generateProof(2);
    expect(proof.leafHash).toBe(leaves[2]);
    expect(proof.rootHash).toBe(root);

    const isProofValid = MerkleTree.verifyProof(proof, root);
    expect(isProofValid).toBe(true);

    // Tampered root fails proof verification
    const isFakeValid = MerkleTree.verifyProof(proof, 'f'.repeat(64));
    expect(isFakeValid).toBe(false);
  });
});
