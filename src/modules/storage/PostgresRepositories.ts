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
      INSERT INTO feature_snapshots (
        stock_id, snapshot_at, feature_set_version, payload
      ) VALUES (
        ${snapshot.stockId}, ${snapshot.snapshotAt}, ${snapshot.featureSetVersion}, ${this.sql.json(snapshot.payload)}
      )
    `;
  }

  async findByStockId(stockId: string, limit: number = 10): Promise<FeatureSnapshot[]> {
    const rows = await this.sql`
      SELECT id, stock_id as "stockId", snapshot_at as "snapshotAt", 
             feature_set_version as "featureSetVersion", payload
      FROM feature_snapshots
      WHERE stock_id = ${stockId}
      ORDER BY snapshot_at DESC
      LIMIT ${limit}
    `;
    return rows as any[];
  }
}

export class PostgresFinalDecisionRepository implements FinalDecisionRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}

  async save(decision: FinalDecision): Promise<void> {
    await this.sql`
      INSERT INTO final_decisions (
        stock_id, decision_date, action, confidence, summary, thesis_status, 
        supporting_rule_ids, blocking_rule_ids, composer_version
      ) VALUES (
        ${decision.stockId}, ${decision.decisionDate}, ${decision.action}, ${decision.confidence}, 
        ${decision.summary}, ${decision.thesisStatus}, ${this.sql.json(decision.supportingRules)}, 
        ${this.sql.json(decision.blockingRules)}, ${decision.composerVersion}
      )
    `;
  }

  async getLatest(stockId: string): Promise<FinalDecision | null> {
    const rows = await this.sql`
      SELECT stock_id as "stockId", decision_date as "decisionDate", action, confidence, 
             summary, thesis_status as "thesisStatus", supporting_rule_ids as "supportingRules", 
             blocking_rule_ids as "blockingRules", composer_version as "composerVersion"
      FROM final_decisions
      WHERE stock_id = ${stockId}
      ORDER BY decision_date DESC, created_at DESC
      LIMIT 1
    `;
    return rows.length > 0 ? (rows[0] as any) : null;
  }
}

export class PostgresResearchRunRepository implements ResearchRunRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}

  async save(run: ResearchRun): Promise<void> {
    await this.sql`
      INSERT INTO research_runs (
        run_id, trade_date, criteria_json, top_n, account_tier, status
      ) VALUES (
        ${run.runId}, ${run.tradeDate}, ${this.sql.json(run.criteria)}, ${run.topN}, ${run.accountTier}, ${run.status}
      )
    `;
  }

  async updateStatus(runId: string, status: ResearchRun['status']): Promise<void> {
    const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;
    await this.sql`
      UPDATE research_runs 
      SET status = ${status}, completed_at = ${completedAt} 
      WHERE run_id = ${runId}
    `;
  }

  async saveResults(results: CandidateResearchResultRecord[]): Promise<void> {
    if (results.length === 0) return;
    
    await this.sql`
      INSERT INTO candidate_research_results ${this.sql(results.map(r => ({
        run_id: r.runId,
        stock_id: r.stockId,
        preliminary_score: r.preliminaryScore,
        research_total_score: r.researchTotalScore, 
        final_action: r.finalAction,
        confidence: r.confidence,
        summary: r.summary
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
    const rows = await this.sql`
      SELECT run_id as "runId", trade_date as "tradeDate", criteria_json as "criteria", 
             top_n as "topN", account_tier as "accountTier", status, started_at as "startedAt"
      FROM research_runs
      WHERE trade_date = ${date}
      ORDER BY created_at DESC
    `;
    return rows as any[];
  }

  async getRunResults(runId: string): Promise<CandidateResearchResultRecord[]> {
    const rows = await this.sql`
      SELECT run_id as "runId", stock_id as "stockId", preliminary_score as "preliminaryScore", 
             research_total_score as "researchTotalScore", final_action as "finalAction", 
             confidence, summary
      FROM candidate_research_results
      WHERE run_id = ${runId}
      ORDER BY research_total_score DESC
    `;
    return rows as any[];
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
    `;
  }

  async findByRunId(runId: string): Promise<ResearchOutcome[]> {
    const rows = await this.sql`
      SELECT run_id as "runId", stock_id as "stockId", action, entry_reference_price as "entryReferencePrice",
             t_plus_1_return as "tPlus1Return", t_plus_5_return as "tPlus5Return", t_plus_20_return as "tPlus20Return",
             max_drawdown as "maxDrawdown", is_correct_direction as "isCorrectDirection"
      FROM research_outcomes
      WHERE run_id = ${runId}
    `;
    return rows as any[];
  }
}
