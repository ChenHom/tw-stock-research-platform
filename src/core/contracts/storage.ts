import type { FeatureSnapshot } from '../types/feature.js';
import type { FinalDecision } from '../types/rule.js';

export interface ResearchRun {
  runId: string;
  tradeDate: string;
  criteria: any;
  topN: number;
  accountTier: string;
  status: 'running' | 'completed' | 'failed';
}

export interface CandidateResearchResultRecord {
  runId: string;
  stockId: string;
  preliminaryScore: number;
  researchTotalScore: number;
  finalAction: string;
  confidence: number;
  summary: string;
}

export interface FeatureSnapshotRepository {
  save(snapshot: FeatureSnapshot): Promise<void>;
}

export interface FinalDecisionRepository {
  save(decision: FinalDecision): Promise<void>;
}

export interface ResearchRunRepository {
  save(run: ResearchRun): Promise<void>;
  updateStatus(runId: string, status: ResearchRun['status']): Promise<void>;
  saveResults(results: CandidateResearchResultRecord[]): Promise<void>;
  
  // 查詢功能 (P1)
  getLatestRun(): Promise<ResearchRun | null>;
  findRunsByDate(date: string): Promise<ResearchRun[]>;
  getRunResults(runId: string): Promise<CandidateResearchResultRecord[]>;
}
