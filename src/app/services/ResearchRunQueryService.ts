import type { ResearchRunRepository, ResearchRun, CandidateResearchResultRecord } from '../../core/contracts/storage.js';

export class ResearchRunQueryService {
  constructor(private readonly repo: ResearchRunRepository) {}

  /**
   * 獲取最近一次完整的研究結果與報表摘要
   */
  async getLatestResearchSummary() {
    const latestRun = await this.repo.getLatestRun();
    if (!latestRun) return null;

    const results = await this.repo.getRunResults(latestRun.runId);
    
    return {
      run: latestRun,
      results
    };
  }

  /**
   * 根據日期查回當天的所有研究記錄
   */
  async getDailyHistory(date: string) {
    const runs = await this.repo.findRunsByDate(date);
    return runs;
  }

  /**
   * 獲取特定任務的詳細結果
   */
  async getRunDetails(runId: string) {
    const results = await this.repo.getRunResults(runId);
    return results;
  }
}
