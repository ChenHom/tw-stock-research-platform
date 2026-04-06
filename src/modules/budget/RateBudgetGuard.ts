export interface BudgetSnapshot {
  providerName: string;
  currentUsage: number;
  requestLimit: number;
  usageRatio: number;
  canProceed: boolean;
  shouldDegrade: boolean;
}

export class RateBudgetGuard {
  constructor(
    private readonly degradeThreshold = 0.8,
    private readonly hardStopThreshold = 0.95
  ) {}

  evaluate(providerName: string, currentUsage: number, requestLimit: number): BudgetSnapshot {
    const usageRatio = requestLimit > 0 ? currentUsage / requestLimit : 1;
    const shouldDegrade = usageRatio >= this.degradeThreshold;
    const canProceed = usageRatio < this.hardStopThreshold;

    if (!canProceed) {
      console.error(`[預算守衛] ${providerName} 點數消耗已達 ${ (usageRatio * 100).toFixed(1) }%，觸發強制停用。`);
    } else if (shouldDegrade) {
      console.warn(`[預算守衛] ${providerName} 點數消耗已達 ${ (usageRatio * 100).toFixed(1) }%，進入降級模式。`);
    }

    return {
      providerName,
      currentUsage,
      requestLimit,
      usageRatio,
      canProceed,
      shouldDegrade
    };
  }
}
