import type { FeatureSnapshotRepository as FeatureSnapshotRepositoryContract, FinalDecisionRepository as FinalDecisionRepositoryContract } from '../../core/contracts/storage.js';
import type { FeatureSnapshot } from '../../core/types/feature.js';
import type { FinalDecision } from '../../core/types/rule.js';

export class InMemoryFeatureSnapshotRepository implements FeatureSnapshotRepositoryContract {
  private readonly items: FeatureSnapshot[] = [];

  async save(snapshot: FeatureSnapshot): Promise<void> {
    this.items.push(snapshot);
    console.log(`[Storage] Saved feature snapshot for ${snapshot.stockId}`);
  }

  all(): FeatureSnapshot[] {
    return this.items;
  }
}

export class InMemoryFinalDecisionRepository implements FinalDecisionRepositoryContract {
  private readonly items: FinalDecision[] = [];

  async save(decision: FinalDecision): Promise<void> {
    this.items.push(decision);
    console.log(`[Storage] Saved final decision for ${decision.stockId}: ${decision.action}`);
  }

  all(): FinalDecision[] {
    return this.items;
  }
}
