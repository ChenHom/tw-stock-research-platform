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
}

export class PostgresFinalDecisionRepository implements FinalDecisionRepositoryContract {
  constructor(private readonly sql: postgres.Sql) {}

  async save(decision: FinalDecision): Promise<void> {
    await this.sql`
      INSERT INTO final_decisions (
        stock_id, decision_date, action, confidence, summary, thesis_status, supporting_rule_ids, blocking_rule_ids, composer_version
      ) VALUES (
        ${decision.stockId}, ${decision.decisionDate}, ${decision.action}, ${decision.confidence}, 
        ${decision.summary}, ${decision.thesisStatus}, ${this.sql.json(decision.supportingRules)}, 
        ${this.sql.json(decision.blockingRules)}, ${decision.composerVersion}
      )
    `;
  }
}
