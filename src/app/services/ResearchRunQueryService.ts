import type { ResearchRunRepository, ResearchRun, CandidateResearchResultRecord } from '../../core/contracts/storage.js';

export interface RunSummary {
  run: ResearchRun;
  results: CandidateResearchResultRecord[];
}

export class ResearchRunQueryService {
  constructor(private readonly repo: ResearchRunRepository) {}

  /**
   * 獲取最近一次的研究任務摘要
   */
  async getLatestRunSummary(): Promise<RunSummary | null> {
    const run = await this.repo.getLatestRun();
    if (!run) return null;

    const results = await this.repo.getRunResults(run.runId);
    return { run, results };
  }

  /**
   * 根據日期查詢當天的所有研究記錄
   */
  async findRunsByDate(date: string): Promise<ResearchRun[]> {
    return this.repo.findRunsByDate(date);
  }

  /**
   * 獲取特定研究任務的詳細結果
   */
  async getRunDetail(runId: string): Promise<CandidateResearchResultRecord[]> {
    return this.repo.getRunResults(runId);
  }
}
