import type { ConfidenceLevel, Direction, ThesisStatus } from './common.js';

export interface ThesisRecord {
  stockId: string;
  direction: Direction;
  thesisStatement: string;
  status: ThesisStatus;
  confidence: ConfidenceLevel;
  pillars: ThesisPillar[];
  disconfirmingEvidence: ThesisCondition[];
  risks: string[];
  catalysts: CatalystItem[];
  entryConditions: string[];
  trimConditions: string[];
  exitConditions: string[];
}

export interface ThesisPillar {
  code: string;
  statement: string;
  trackingMetrics: string[];
}

export interface ThesisCondition {
  code: string;
  statement: string;
  triggers: string[];
}

export interface CatalystItem {
  eventType: string;
  eventDate?: string;
  eventWindow?: string;
  expectedImpact?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ValuationSnapshot {
  stockId: string;
  snapshotDate: string;
  primaryMethod: 'pe' | 'pb' | 'ev_ebitda' | 'dcf' | 'ps' | 'dividend_yield' | 'normalized_cycle';
  peerGroup: string[];
  fairValueBear?: number;
  fairValueBase?: number;
  fairValueBull?: number;
  assumptions: Record<string, unknown>;
}
