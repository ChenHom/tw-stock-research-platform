import type { FeatureSnapshot } from '../types/feature.js';
import type { FinalDecision } from '../types/rule.js';

export interface FeatureSnapshotRepository {
  save(snapshot: FeatureSnapshot): Promise<void>;
}

export interface FinalDecisionRepository {
  save(decision: FinalDecision): Promise<void>;
}
