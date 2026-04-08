import test from 'node:test';
import assert from 'node:assert/strict';
import { ResearchPerformanceService } from '../src/app/services/ResearchPerformanceService.js';
import { InMemoryResearchOutcomeRepository, InMemoryResearchRunRepository } from '../src/modules/storage/InMemoryRepositories.js';

test('ResearchPerformanceService: 應正確計算勝率、動作拆解與規則/論點 Breakdown', async (t) => {
  const outcomeRepo = new InMemoryResearchOutcomeRepository();
  const runRepo = new InMemoryResearchRunRepository();
  const service = new ResearchPerformanceService(outcomeRepo, runRepo);
  const runId = 'test-run-perf-v2';

  // 1. 準備 Mock 資料 (研究結果 + 規則細節)
  await runRepo.saveResults([
    { 
      runId, stockId: '2330', preliminaryScore: 70, researchTotalScore: 85, 
      finalAction: 'BUY', confidence: 80, summary: 'Good',
      ruleResults: [{ ruleId: 'rule-tech-ma', triggered: true }, { ruleId: 'rule-fund-rev', triggered: true }],
      thesisStatus: 'thesis_met'
    },
    { 
      runId, stockId: '2317', preliminaryScore: 60, researchTotalScore: 75, 
      finalAction: 'SELL', confidence: 70, summary: 'Bad',
      ruleResults: [{ ruleId: 'rule-risk-stop', triggered: true }],
      thesisStatus: 'thesis_broken'
    }
  ]);

  // 2. 準備 Mock 成效
  await outcomeRepo.save({ runId, stockId: '2330', action: 'BUY', entryReferencePrice: 100, tPlus5Return: 0.1, isCorrectDirection: true });
  await outcomeRepo.save({ runId, stockId: '2317', action: 'SELL', entryReferencePrice: 50, tPlus5Return: -0.05, isCorrectDirection: true });

  // 3. 測試規則拆解
  const ruleBreakdown = await service.getRuleBreakdown(runId);
  assert.strictEqual(ruleBreakdown.length, 3);
  
  const techMa = ruleBreakdown.find(r => r.ruleId === 'rule-tech-ma');
  assert.strictEqual(techMa?.hitCount, 1);
  assert.strictEqual(techMa?.accuracy, 1);
  assert.strictEqual(techMa?.avgReturn, 0.1);

  // 4. 測試論點拆解
  const thesisBreakdown = await service.getThesisBreakdown(runId);
  assert.strictEqual(thesisBreakdown.length, 2);
  
  const metStatus = thesisBreakdown.find(t => t.status === 'thesis_met');
  assert.strictEqual(metStatus?.count, 1);
  assert.strictEqual(metStatus?.accuracy, 1);
});