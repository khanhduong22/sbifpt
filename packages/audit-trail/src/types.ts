export interface AuditEntryRecord {
  id: string;
  sequence: number;
  timestamp: string | Date;
  action: string;
  actorId?: string | null;
  detailsJson: string | Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}

export interface ChainVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  errorIndex?: number;
  errorReason?: string;
  merkleRoot?: string;
}

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleProof {
  leafHash: string;
  leafIndex: number;
  rootHash: string;
  proof: MerkleProofStep[];
}
