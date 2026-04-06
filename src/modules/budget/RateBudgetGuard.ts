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
    return {
      providerName,
      currentUsage,
      requestLimit,
      usageRatio,
      canProceed: usageRatio < this.hardStopThreshold,
      shouldDegrade: usageRatio >= this.degradeThreshold
    };
  }
}
