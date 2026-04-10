import type { FeatureSnapshot } from '../types/feature.js';
import type { FinalDecision } from '../types/rule.js';

export interface ResearchRun {
  runId: string;
  tradeDate: string;
  criteria: any;
  topN: number;
  accountTier: string;
  status: 'running' | 'completed' | 'failed';
  startedAt?: Date;
}

export interface CandidateResearchResultRecord {
  runId: string;
  stockId: string;
  preliminaryScore: number;
  researchTotalScore: number;
  finalAction: string;
  confidence: number;
  summary: string;
  ruleResults: any[];  // 儲存規則判定細節 (P0: 分析用)
  thesisStatus: string; // 儲存論點狀態 (P0: 分析用)
}

export interface ResearchOutcome {
  runId: string;
  stockId: string;
  action: string;
  entryReferencePrice: number;
  tPlus1Return?: number;
  tPlus5Return?: number;
  tPlus20Return?: number;
  maxDrawdown?: number;
  isCorrectDirection?: boolean;
  baselineReturn?: number; // 同期大盤報酬
  alpha?: number;          // 超額報酬 (Outcome Return - Baseline Return)
}

export interface ResearchOutcomeRepository {
  save(outcome: ResearchOutcome): Promise<void>;
  findByRunId(runId: string): Promise<ResearchOutcome[]>;
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
  getRunById(runId: string): Promise<ResearchRun | null>;
  findRunsByDate(date: string): Promise<ResearchRun[]>;
  getRunResults(runId: string): Promise<CandidateResearchResultRecord[]>;
}
