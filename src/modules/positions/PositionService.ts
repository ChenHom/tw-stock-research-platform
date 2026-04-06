export interface PositionState {
  stockId: string;
  entryPrice: number;
  shares: number;
  strategy: 'fixed' | 'trailing';
  stopLoss?: number;
  takeProfit?: number;
  highPrice?: number;
  trailingPct?: number;
}

export class PositionService {
  updateTrailingHigh(position: PositionState, currentPrice: number): PositionState {
    if (position.strategy !== 'trailing') return position;
    if ((position.highPrice ?? 0) >= currentPrice) return position;
    return { ...position, highPrice: currentPrice };
  }
}
