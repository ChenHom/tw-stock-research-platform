import postgres from 'postgres';
import type { FeatureSnapshotRepository as FeatureSnapshotRepositoryContract, FinalDecisionRepository as FinalDecisionRepositoryContract } from '../../core/contracts/storage.js';
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
