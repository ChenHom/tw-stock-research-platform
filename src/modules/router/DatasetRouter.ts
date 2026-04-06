import type { DatasetRouter as DatasetRouterContract, RoutingDecision } from '../../core/contracts/router.js';
import type { AccountTier } from '../../core/types/common.js';
import { DATASET_CAPABILITIES, resolveQueryMode } from '../../config/datasets.js';

export class DefaultDatasetRouter implements DatasetRouterContract {
  decide(dataset: string, accountTier: AccountTier, stockId?: string): RoutingDecision {
    const capability = DATASET_CAPABILITIES.find((row) => row.dataset === dataset);
    if (!capability) {
      throw new Error(`Unknown dataset: ${dataset}`);
    }

    const queryMode = resolveQueryMode(dataset, accountTier);
    const providerOrder = capability.providerOrder.slice();

    const reasonParts: string[] = [
      `dataset=${dataset}`,
      `tier=${accountTier}`,
      `queryMode=${queryMode}`
    ];

    if (stockId) {
      reasonParts.push(`stockId=${stockId}`);
    }

    if (accountTier === 'free_tier_600ph' && queryMode === 'per_stock' && !stockId) {
      reasonParts.push('free tier requires candidate-pool enrichment only');
    }

    return {
      dataset,
      providerOrder,
      queryMode,
      supportsFallback: providerOrder.length > 1,
      accountTier,
      reason: reasonParts.join(', ')
    };
  }
}
