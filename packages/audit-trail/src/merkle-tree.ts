import { createHash } from 'node:crypto';
import { AuditEntryRecord, MerkleProof, MerkleProofStep } from './types';

/**
 * Hash two child nodes to compute the parent node in the Merkle Tree
 */
export function hashPair(left: string, right: string): string {
  return createHash('sha256').update(left + right).digest('hex');
}

/**
 * Cryptographic Merkle Tree for batch anchoring and tamper-evident audit proofs
 */
export class MerkleTree {
  private readonly leaves: string[];
  private readonly levels: string[][];

  constructor(inputs: string[] | AuditEntryRecord[]) {
    if (inputs.length === 0) {
      this.leaves = [createHash('sha256').update('EMPTY_ROOT').digest('hex')];
    } else if (typeof inputs[0] === 'string') {
      this.leaves = [...(inputs as string[])];
    } else {
      this.leaves = (inputs as AuditEntryRecord[]).map((entry) => entry.currentHash);
    }

    this.levels = this.buildTree(this.leaves);
  }

  /**
   * Internal recursive builder for Merkle Tree levels
   */
  private buildTree(leaves: string[]): string[][] {
    const levels: string[][] = [leaves];
    let currentLevel = leaves;

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(hashPair(left, right));
      }

      levels.push(nextLevel);
      currentLevel = nextLevel;
    }

    return levels;
  }

  /**
   * Returns the root hash of the Merkle Tree
   */
  public getRoot(): string {
    const topLevel = this.levels[this.levels.length - 1];
    return topLevel && topLevel.length > 0 ? topLevel[0] : '';
  }

  /**
   * Returns all leaf hashes
   */
  public getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * Generate an audit inclusion proof for a leaf at the given index
   */
  public generateProof(leafIndex: number): MerkleProof {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds (0-${this.leaves.length - 1})`);
    }

    const leafHash = this.leaves[leafIndex];
    const proof: MerkleProofStep[] = [];
    let currentIndex = leafIndex;

    for (let levelIdx = 0; levelIdx < this.levels.length - 1; levelIdx++) {
      const level = this.levels[levelIdx];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      let siblingHash: string;
      if (siblingIndex < level.length) {
        siblingHash = level[siblingIndex];
      } else {
        siblingHash = level[currentIndex];
      }

      proof.push({
        position: isRightNode ? 'left' : 'right',
        hash: siblingHash,
      });

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leafHash,
      leafIndex,
      rootHash: this.getRoot(),
      proof,
    };
  }

  /**
   * Static method to verify a Merkle proof against a known root
   */
  public static verifyProof(proof: MerkleProof, expectedRoot: string): boolean {
    let currentHash = proof.leafHash;

    for (const step of proof.proof) {
      if (step.position === 'left') {
        currentHash = hashPair(step.hash, currentHash);
      } else {
        currentHash = hashPair(currentHash, step.hash);
      }
    }

    return currentHash === expectedRoot;
  }
}
