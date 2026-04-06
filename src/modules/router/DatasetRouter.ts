import type { DatasetRouter as DatasetRouterContract, RoutingDecision, QueryCostEstimate } from '../../core/contracts/router.js';
import type { AccountTier, QueryMode } from '../../core/types/common.js';
import type { BudgetSnapshot } from '../budget/RateBudgetGuard.js';
import { DATASET_CAPABILITIES, resolveQueryMode } from '../../config/datasets.js';

export class DefaultDatasetRouter implements DatasetRouterContract {
  decide(
    dataset: string,
    accountTier: AccountTier,
    budget?: BudgetSnapshot,
    stockId?: string
  ): RoutingDecision {
    const capability = DATASET_CAPABILITIES.find((row) => row.dataset === dataset);
    if (!capability) throw new Error(`Unknown dataset: ${dataset}`);

    const queryMode = resolveQueryMode(dataset, accountTier);
    const estimatedCost = this.estimateCost(dataset, accountTier, queryMode);
    
    let finalProviderOrder = [...capability.providerOrder];
    let degradeMode: RoutingDecision['degradeMode'] = 'none';
    let canProceed = true;
    const reasonParts: string[] = [`tier=${accountTier}`, `mode=${queryMode}`];

    // 實作降級邏輯 (P0-3)
    if (budget) {
      if (!budget.canProceed) {
        // 強制停止：只保留官方免費源
        finalProviderOrder = finalProviderOrder.filter(p => p === 'twse');
        canProceed = finalProviderOrder.length > 0;
        degradeMode = 'official_only';
        reasonParts.push('budget_halt: official_only');
      } else if (budget.shouldDegrade) {
        // 進入降級：對特定資料集實施限制
        if (dataset === 'stock_news') {
          degradeMode = 'skip_non_essential';
          canProceed = false;
          reasonParts.push('degrade: skip_news');
        } else if (dataset === 'month_revenue' && !stockId) {
          degradeMode = 'watchlist_only';
          reasonParts.push('degrade: watchlist_only');
        }
      }
    }

    return {
      dataset,
      providerOrder: capability.providerOrder,
      finalProviderOrder,
      queryMode,
      supportsFallback: finalProviderOrder.length > 1,
      accountTier,
      estimatedCost,
      degradeMode,
      canProceed,
      reason: reasonParts.join(', ')
    };
  }

  private estimateCost(dataset: string, tier: AccountTier, mode: QueryMode): QueryCostEstimate {
    const cap = DATASET_CAPABILITIES.find(c => c.dataset === dataset);
    if (!cap) return { estimatedCalls: 0, estimatedCostUnits: 0 };

    const { costModel } = cap;
    let base = costModel.freeTierPerRequest;
    if (tier === 'backer') base = costModel.backerTierPerRequest ?? base;
    if (tier === 'sponsor') base = costModel.sponsorTierPerRequest ?? base;

    if (mode === 'bulk') {
      const mult = costModel.bulkMultiplier ?? 1;
      return { estimatedCalls: mult, estimatedCostUnits: base * mult };
    }
    return { estimatedCalls: 1, estimatedCostUnits: base };
  }
}
