import type { RuleContext } from '../../core/types/rule.js';

export type EvidenceType = 'feature_snapshot' | 'event' | 'valuation_snapshot' | 'news_verified';
export type EvidencePolarity = 'support' | 'risk' | 'disconfirm';
export type ThesisStatus = 'draft' | 'active' | 'weakened' | 'broken' | 'archived';

export interface ThesisEvidenceRef {
  type: EvidenceType;
  refId: string; // 指向對應 snapshot 的 ID
  pillarKey?: string; // 該證據支持的論點支柱 Key
  polarity: EvidencePolarity;
  note?: string;
}

export interface CreateThesisInput {
  stockId: string;
  statement: string;
  direction: 'long' | 'short' | 'neutral';
  evidence: ThesisEvidenceRef[];
  convictionScore?: number;
}

export interface ThesisSnapshot {
  thesisId: string;
  version: number;
  status: ThesisStatus;
  statement: string;
  direction: 'long' | 'short' | 'neutral';
  convictionScore: number;
  evidence: ThesisEvidenceRef[];
  createdAt: string;
}

export class ThesisTracker {
  /**
   * 建立新版本的 Thesis
   */
  createVersion(input: CreateThesisInput, currentVersion: number = 0): ThesisSnapshot {
    return {
      thesisId: crypto.randomUUID(),
      version: currentVersion + 1,
      status: 'active',
      statement: input.statement,
      direction: input.direction,
      convictionScore: input.convictionScore ?? 50,
      evidence: input.evidence,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 根據新的上下文評估 Thesis 狀態
   * 邏輯：
   * - 關鍵 support evidence 失效 1 項 -> weakened
   * - 關鍵 support evidence 失效 2 項以上，或 disconfirm evidence 命中主論點 -> broken
   */
  evaluateStatus(current: ThesisSnapshot, context: RuleContext): ThesisStatus {
    void context; // TODO: 實作與 context 的比對邏輯
    
    // 預設維持原狀，直到實作自動檢測
    return current.status;
  }
}
