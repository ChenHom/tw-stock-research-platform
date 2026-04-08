import postgres from 'postgres';
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

export class PostgresFeatureSnapshotRepository implements FeatureSnapshotRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}
  async save(snapshot: FeatureSnapshot): Promise<void> {
    await this.sql`
      INSERT INTO feature_snapshots (id, stock_id, snapshot_at, feature_set_version, payload)
      VALUES (${snapshot.id}, ${snapshot.stockId}, ${snapshot.snapshotAt}, ${snapshot.featureSetVersion}, ${this.sql.json(snapshot.payload)})
    `;
  }
}

export class PostgresFinalDecisionRepository implements FinalDecisionRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}
  async save(decision: FinalDecision): Promise<void> {
    await this.sql`
      INSERT INTO final_decisions (stock_id, decision_date, action, confidence, summary, supporting_rules, blocking_rules, thesis_status, composer_version)
      VALUES (${decision.stockId}, ${decision.decisionDate}, ${decision.action}, ${decision.confidence}, ${decision.summary}, ${decision.supportingRules}, ${decision.blockingRules}, ${decision.thesisStatus}, ${decision.composerVersion})
    `;
  }
}

export class PostgresResearchRunRepository implements ResearchRunRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}

  async save(run: ResearchRun): Promise<void> {
    await this.sql`
      INSERT INTO research_runs (run_id, trade_date, criteria_json, top_n, account_tier, status, started_at)
      VALUES (${run.runId}, ${run.tradeDate}, ${this.sql.json(run.criteria)}, ${run.topN}, ${run.accountTier}, ${run.status}, ${run.startedAt || new Date()})
    `;
  }

  async updateStatus(runId: string, status: ResearchRun['status']): Promise<void> {
    await this.sql`
      UPDATE research_runs 
      SET status = ${status}, 
          completed_at = ${status === 'completed' ? new Date() : null}
      WHERE run_id = ${runId}
    `;
  }

  async saveResults(results: CandidateResearchResultRecord[]): Promise<void> {
    if (results.length === 0) return;
    
    // 使用 JSONB 儲存 rule_results 以供績效分析
    await this.sql`
      INSERT INTO candidate_research_results ${this.sql(results.map(r => ({
        run_id: r.runId,
        stock_id: r.stockId,
        preliminary_score: r.preliminaryScore,
        research_total_score: r.researchTotalScore, 
        final_action: r.finalAction,
        confidence: r.confidence,
        summary: r.summary,
        rule_results: this.sql.json(r.ruleResults),
        thesis_status: r.thesisStatus
      })))}
    `;
  }

  async getLatestRun(): Promise<ResearchRun | null> {
    const rows = await this.sql`
      SELECT run_id as "runId", trade_date as "tradeDate", criteria_json as "criteria", 
             top_n as "topN", account_tier as "accountTier", status, started_at as "startedAt"
      FROM research_runs
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return rows.length > 0 ? (rows[0] as any) : null;
  }

  async getRunById(runId: string): Promise<ResearchRun | null> {
    const rows = await this.sql`
      SELECT run_id as "runId", trade_date as "tradeDate", criteria_json as "criteria", 
             top_n as "topN", account_tier as "accountTier", status, started_at as "startedAt"
      FROM research_runs
      WHERE run_id = ${runId}
    `;
    return rows.length > 0 ? (rows[0] as any) : null;
  }

  async findRunsByDate(date: string): Promise<ResearchRun[]> {
    return await this.sql`
      SELECT run_id as "runId", trade_date as "tradeDate", criteria_json as "criteria", 
             top_n as "topN", account_tier as "accountTier", status, started_at as "startedAt"
      FROM research_runs
      WHERE trade_date = ${date}
      ORDER BY created_at DESC
    `;
  }

  async getRunResults(runId: string): Promise<CandidateResearchResultRecord[]> {
    const rows = await this.sql`
      SELECT run_id as "runId", stock_id as "stockId", preliminary_score as "preliminaryScore", 
             research_total_score as "researchTotalScore", final_action as "finalAction", 
             confidence, summary, rule_results as "ruleResults", thesis_status as "thesisStatus"
      FROM candidate_research_results
      WHERE run_id = ${runId}
      ORDER BY research_total_score DESC
    `;
    // PostgreSQL 回傳的 JSONB 會自動解析為物件，但需確保它是陣列
    return rows.map(r => ({
      ...r,
      ruleResults: Array.isArray(r.ruleResults) ? r.ruleResults : []
    })) as any[];
  }
}

export class PostgresResearchOutcomeRepository implements ResearchOutcomeRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}

  async save(outcome: ResearchOutcome): Promise<void> {
    await this.sql`
      INSERT INTO research_outcomes (
        run_id, stock_id, action, entry_reference_price, 
        t_plus_1_return, t_plus_5_return, t_plus_20_return, 
        max_drawdown, is_correct_direction
      ) VALUES (
        ${outcome.runId}, ${outcome.stockId}, ${outcome.action}, ${outcome.entryReferencePrice},
        ${outcome.tPlus1Return ?? null}, ${outcome.tPlus5Return ?? null}, ${outcome.tPlus20Return ?? null},
        ${outcome.maxDrawdown ?? null}, ${outcome.isCorrectDirection ?? null}
      )
      ON CONFLICT (run_id, stock_id) DO UPDATE SET
        t_plus_1_return = EXCLUDED.t_plus_1_return,
        t_plus_5_return = EXCLUDED.t_plus_5_return,
        t_plus_20_return = EXCLUDED.t_plus_20_return,
        is_correct_direction = EXCLUDED.is_correct_direction
    `;
  }

  async findByRunId(runId: string): Promise<ResearchOutcome[]> {
    const rows = await this.sql`
      SELECT run_id as "runId", stock_id as "stockId", action, 
             entry_reference_price as "entryReferencePrice",
             t_plus_1_return as "tPlus1Return", t_plus_5_return as "tPlus5Return", t_plus_20_return as "tPlus20Return",
             max_drawdown as "maxDrawdown", is_correct_direction as "isCorrectDirection"
      FROM research_outcomes
      WHERE run_id = ${runId}
    `;
    return rows as any[];
  }
}
