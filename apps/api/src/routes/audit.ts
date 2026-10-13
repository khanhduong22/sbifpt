import { Hono } from 'hono';
import prisma from '@sbifpt/db';
import {
  GENESIS_HASH,
  MerkleTree,
  verifyAuditChain,
  AuditEntryRecord,
} from '@sbifpt/audit-trail';
import { COMPLIANCE_STANDARDS } from '@sbifpt/shared';

export const auditRouter = new Hono();

/**
 * GET /api/audit/proof-pack
 * Generates Japanese SOX / ISO 27001 verifiable cryptographic Merkle proof
 * with SHA-256 chain integrity verification.
 */
auditRouter.get('/api/audit/proof-pack', async (c) => {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { sequence: 'asc' },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
    },
  });

  // Map to AuditEntryRecord format
  const records: AuditEntryRecord[] = auditLogs.map((log) => ({
    id: log.id,
    sequence: log.sequence,
    timestamp: log.timestamp,
    action: log.action,
    actorId: log.actorId,
    detailsJson: log.detailsJson,
    previousHash: log.previousHash,
    currentHash: log.currentHash,
  }));

  // Perform full cryptographic chain verification
  const verification = verifyAuditChain(records, GENESIS_HASH);

  // Build Merkle Tree from all current hashes
  const merkleTree = new MerkleTree(records);
  const merkleRoot = merkleTree.getRoot();

  const auditTrail = auditLogs.map((log, index) => {
    let parsedDetails = {};
    try {
      parsedDetails = JSON.parse(log.detailsJson);
    } catch {
      parsedDetails = { raw: log.detailsJson };
    }

    return {
      sequence: log.sequence,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      actor: log.actor ? `${log.actor.name} (${log.actor.role})` : log.actorId,
      actorDepartment: log.actor?.department ?? 'System',
      hash: log.currentHash,
      previousHash: log.previousHash,
      details: parsedDetails,
      tamperDetected: verification.isValid ? false : verification.errorIndex === index,
    };
  });

  const latestBlock = auditLogs[auditLogs.length - 1];

  return c.json({
    chainValid: verification.isValid,
    totalBlocks: auditLogs.length,
    verifiedBlocks: verification.verifiedBlocks,
    merkleRoot,
    genesisHash: GENESIS_HASH,
    latestHash: latestBlock?.currentHash ?? GENESIS_HASH,
    verifiedAt: new Date().toISOString(),
    complianceStandard: `${COMPLIANCE_STANDARDS.J_SOX} / ${COMPLIANCE_STANDARDS.ISO_27001} / ${COMPLIANCE_STANDARDS.FISC}`,
    tamperingError: verification.isValid ? null : verification.errorReason,
    auditTrail,
  });
});
