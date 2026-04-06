export interface ResolvedSymbol {
  input: string;
  stockId?: string;
  stockName?: string;
  board?: string;
  confidence: number;
  candidates: Array<{ stockId: string; stockName: string; confidence: number }>;
}

export class SymbolResolver {
  resolve(input: string): ResolvedSymbol {
    return {
      input,
      confidence: 0,
      candidates: []
    };
  }
}
