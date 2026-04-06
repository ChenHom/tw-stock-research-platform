import type { DatasetRouter as DatasetRouterContract, RoutingDecision } from '../../core/contracts/router.js';
import type { AccountTier, QueryMode } from '../../core/types/common.js';
import { DATASET_CAPABILITIES, resolveQueryMode } from '../../config/datasets.js';

export interface QueryCostEstimate {
  estimatedCalls: number;
  estimatedCostUnits: number;
}

export class DefaultDatasetRouter implements DatasetRouterContract {
  decide(dataset: string, accountTier: AccountTier, stockId?: string): RoutingDecision {
    const capability = DATASET_CAPABILITIES.find((row) => row.dataset === dataset);
    if (!capability) {
      throw new Error(`Unknown dataset: ${dataset}`);
    }

    const queryMode = resolveQueryMode(dataset, accountTier);
    const providerOrder = capability.providerOrder.slice();

    // 實作第一階段：成本預估
    const costEstimate = this.estimateCost(dataset, accountTier, queryMode, !!stockId);

    const reasonParts: string[] = [
      `dataset=${dataset}`,
      `tier=${accountTier}`,
      `queryMode=${queryMode}`,
      `estCost=${costEstimate.estimatedCostUnits}`
    ];

    if (stockId) {
      reasonParts.push(`stockId=${stockId}`);
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

  /**
   * 預估本次查詢的點數消耗
   */
  private estimateCost(
    dataset: string,
    accountTier: AccountTier,
    queryMode: QueryMode,
    hasStockId: boolean
  ): QueryCostEstimate {
    const capability = DATASET_CAPABILITIES.find((row) => row.dataset === dataset);
    if (!capability) return { estimatedCalls: 0, estimatedCostUnits: 0 };

    const { costModel } = capability;
    let baseCost = costModel.freeTierPerRequest;
    
    if (accountTier === 'backer') {
      baseCost = costModel.backerTierPerRequest ?? baseCost;
    } else if (accountTier === 'sponsor') {
      baseCost = costModel.sponsorTierPerRequest ?? baseCost;
    }

    if (queryMode === 'bulk') {
      const multiplier = costModel.bulkMultiplier ?? 1;
      return {
        estimatedCalls: multiplier,
        estimatedCostUnits: baseCost * multiplier
      };
    }

    return {
      estimatedCalls: 1,
      estimatedCostUnits: baseCost
    };
  }
}
