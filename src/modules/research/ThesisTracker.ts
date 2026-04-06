import type { RuleContext } from '../../core/types/rule.js';
import type { ThesisStatus, Direction } from '../../core/types/common.js';

export type EvidenceType = 'feature_snapshot' | 'event' | 'valuation_snapshot' | 'news_verified';
export type EvidencePolarity = 'support' | 'risk' | 'disconfirm';

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
  direction: Direction;
  evidence: ThesisEvidenceRef[];
  convictionScore?: number;
}

export interface ThesisSnapshot {
  thesisId: string;
  version: number;
  status: ThesisStatus;
  statement: string;
  direction: Direction;
  convictionScore: number;
  evidence: ThesisEvidenceRef[];
  createdAt: string;
}

export class ThesisTracker {
  /**
   * 建立全新的 Thesis Head
   */
  createThesis(input: CreateThesisInput): ThesisSnapshot {
    return {
      thesisId: crypto.randomUUID(),
      version: 1,
      status: 'active',
      statement: input.statement,
      direction: input.direction,
      convictionScore: input.convictionScore ?? 50,
      evidence: input.evidence,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 基於現有 Thesis 建立新版本 (版本鏈)
   */
  appendVersion(current: ThesisSnapshot, input: Partial<CreateThesisInput>): ThesisSnapshot {
    return {
      ...current,
      version: current.version + 1,
      statement: input.statement ?? current.statement,
      direction: input.direction ?? current.direction,
      evidence: input.evidence ?? current.evidence,
      convictionScore: input.convictionScore ?? current.convictionScore,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 根據新的上下文評估 Thesis 狀態 (最小可用版)
   * 邏輯：
   * - 關鍵 support evidence 失效 (如特徵異常) -> weakened
   * - 關鍵 disconfirm evidence 命中 -> broken
   */
  evaluateStatus(current: ThesisSnapshot, context: RuleContext): ThesisStatus {
    const { features } = context;
    
    // 範例：若證據中包含 'revenue_acceleration' 且目前營收特徵顯示衰退，則削弱或判定論點破壞
    const disconfirmingHits = current.evidence.filter(e => e.polarity === 'disconfirm' && features[e.pillarKey ?? ''] === true);
    if (disconfirmingHits.length > 0) return 'broken';

    const supportFails = current.evidence.filter(e => e.polarity === 'support' && features[e.pillarKey ?? ''] === false);
    if (supportFails.length >= 2) return 'broken';
    if (supportFails.length === 1) return 'weakened';

    return current.status === 'draft' ? 'active' : current.status;
  }
}
