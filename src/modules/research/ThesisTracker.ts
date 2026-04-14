import type { RuleContext } from '../../core/types/rule.js';
import type { ThesisStatus, Direction } from '../../core/types/common.js';
import type { FeatureKey } from '../../core/types/feature.js';

export type EvidenceType = 'feature_snapshot' | 'event' | 'valuation_snapshot';
export type EvidencePolarity = 'support' | 'risk' | 'disconfirm';
export type ComparisonType = 'eq_true' | 'eq_false' | 'gte' | 'lte';

export interface ThesisEvidenceRef {
  type: EvidenceType;
  refId: string;
  pillarKey: FeatureKey; // 強化型別
  polarity: EvidencePolarity;
  comparison?: ComparisonType;
  threshold?: number;
  label?: string;
  note?: string;
}

export interface ThesisEvaluation {
  status: ThesisStatus;
  supportPasses: string[];
  supportFails: string[];
  riskHits: string[];
  disconfirmHits: string[];
  recoverySignals: string[];
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
  lastEvaluation?: ThesisEvaluation;
}

export class ThesisTracker {
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
   * 強化版狀態評估邏輯 (P1-4)
   */
  evaluateStatus(current: ThesisSnapshot, context: RuleContext): ThesisStatus {
    return this.evaluateDetailed(current, context).status;
  }

  evaluateDetailed(current: ThesisSnapshot, context: RuleContext): ThesisEvaluation {
    const { features } = context;
    const supportPasses: string[] = [];
    const supportFails: string[] = [];
    const riskHits: string[] = [];
    const disconfirmHits: string[] = [];

    for (const ev of current.evidence) {
      const value = (features as any)[ev.pillarKey];
      let isMet = true;
      const label = ev.label ?? ev.note ?? ev.pillarKey;

      // 支援多種比較運算
      if (ev.comparison === 'eq_true') isMet = value === true;
      else if (ev.comparison === 'eq_false') isMet = value === false;
      else if (ev.comparison === 'gte' && ev.threshold !== undefined) isMet = value >= ev.threshold;
      else if (ev.comparison === 'lte' && ev.threshold !== undefined) isMet = value <= ev.threshold;
      else isMet = !!value;

      if (ev.polarity === 'support') {
        if (isMet) supportPasses.push(label);
        else supportFails.push(label);
      }
      if (isMet && ev.polarity === 'risk') riskHits.push(label);
      if (isMet && ev.polarity === 'disconfirm') disconfirmHits.push(label);
    }

    const recoverySignals = supportPasses.filter(signal =>
      current.status === 'weakened' || current.status === 'draft'
    );

    let status: ThesisStatus;
    if (disconfirmHits.length > 0) status = 'broken';
    else if (supportFails.length >= 2) status = 'broken';
    else if (riskHits.length > 0 && supportFails.length > 0) status = 'broken';
    else if (riskHits.length > 0 || supportFails.length === 1) status = 'weakened';
    else status = 'active';

    if (current.status === 'archived') status = 'archived';

    return {
      status,
      supportPasses,
      supportFails,
      riskHits,
      disconfirmHits,
      recoverySignals
    };
  }
}
