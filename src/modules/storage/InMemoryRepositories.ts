import type { 
  FeatureSnapshotRepository as FeatureSnapshotRepositoryContract, 
  FinalDecisionRepository as FinalDecisionRepositoryContract,
  ResearchRunRepository as ResearchRunRepositoryContract,
  ResearchOutcomeRepository as ResearchOutcomeRepositoryContract,
  ResearchRun,
  CandidateResearchResultRecord,
  ResearchOutcome
} from '../../core/contracts/storage.js';
import type { FeatureSnapshot } from '../../core/types/feature.js';
import type { FinalDecision } from '../../core/types/rule.js';

export class InMemoryFeatureSnapshotRepository implements FeatureSnapshotRepositoryContract {
  private readonly items: FeatureSnapshot[] = [];

  async save(snapshot: FeatureSnapshot): Promise<void> {
    this.items.push(snapshot);
    console.log(`[Storage] 儲存特徵快照: ${snapshot.stockId}`);
  }

  all(): FeatureSnapshot[] {
    return this.items;
  }
}

export class InMemoryFinalDecisionRepository implements FinalDecisionRepositoryContract {
  private readonly items: FinalDecision[] = [];

  async save(decision: FinalDecision): Promise<void> {
    this.items.push(decision);
    console.log(`[Storage] 儲存最終決策: ${decision.stockId} -> ${decision.action}`);
  }

  all(): FinalDecision[] {
    return this.items;
  }
}

export class InMemoryResearchRunRepository implements ResearchRunRepositoryContract {
  private runs: ResearchRun[] = [];
  private results: CandidateResearchResultRecord[] = [];

  async save(run: ResearchRun): Promise<void> {
    this.runs.push(run);
    console.log(`[Storage] 儲存研究任務: ${run.runId} (${run.status})`);
  }

  async updateStatus(runId: string, status: ResearchRun['status']): Promise<void> {
    const run = this.runs.find(r => r.runId === runId);
    if (run) run.status = status;
  }

  async saveResults(results: CandidateResearchResultRecord[]): Promise<void> {
    this.results.push(...results);
    console.log(`[Storage] 儲存了 ${results.length} 筆研究結果`);
  }

  async getLatestRun(): Promise<ResearchRun | null> {
    return this.runs[this.runs.length - 1] || null;
  }

  async findRunsByDate(date: string): Promise<ResearchRun[]> {
    return this.runs.filter(r => r.tradeDate === date);
  }

  async getRunResults(runId: string): Promise<CandidateResearchResultRecord[]> {
    return this.results.filter(r => r.runId === runId).sort((a, b) => b.researchTotalScore - a.researchTotalScore);
  }
}

export class InMemoryResearchOutcomeRepository implements ResearchOutcomeRepositoryContract {
  private outcomes: ResearchOutcome[] = [];

  async save(outcome: ResearchOutcome): Promise<void> {
    this.outcomes.push(outcome);
    console.log(`[Storage] 儲存成效數據: ${outcome.stockId} (Run: ${outcome.runId})`);
  }

  async findByRunId(runId: string): Promise<ResearchOutcome[]> {
    return this.outcomes.filter(o => o.runId === runId);
  }
}
