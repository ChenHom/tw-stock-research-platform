import type { AccountTier, ThesisStatus } from '../types/common.js';
import type { FeatureSnapshot } from '../types/feature.js';
import type { FinalDecision, RuleResult } from '../types/rule.js';
import type { ThesisSnapshot } from '../../modules/research/ThesisTracker.js';

export interface RunResearchInput {
  stockId: string;
  tradeDate: string;
  accountTier: AccountTier;
  useCache?: boolean;
  hasPosition?: boolean; // 預設為 false
}

export interface PipelineRawData {
  marketDaily?: any;
  valuationDaily?: any;
  institutionalFlow?: any;
  monthRevenue?: any;
  marginShort?: any;
  news?: any[];
}

export interface ResearchDiagnostics {
  isHistoricalPointInTime: boolean;
  isNonTradingDay: boolean;
}

export interface RunResearchOutput {
  stockId: string;
  tradeDate: string;
  rawData: PipelineRawData;
  diagnostics: ResearchDiagnostics;
  featureSnapshot: FeatureSnapshot;
  thesisSnapshot?: ThesisSnapshot;
  thesisStatus: ThesisStatus | 'none';
  ruleResults: RuleResult[];
  finalDecision: FinalDecision;
}
