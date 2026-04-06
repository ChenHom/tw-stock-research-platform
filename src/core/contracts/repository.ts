import type { StockFeatureSet } from '../types/feature.js';
import type { ThesisRecord, ValuationSnapshot } from '../types/research.js';

export interface StockMasterRepository {
  listActiveStocks(): Promise<Array<{ stockId: string; stockName: string; board: string }>>;
  findById(stockId: string): Promise<{ stockId: string; stockName: string; board: string } | null>;
}

export interface FeatureRepository {
  saveFeatureSet(featureSet: StockFeatureSet): Promise<void>;
  getFeatureSet(stockId: string, tradeDate: string): Promise<StockFeatureSet | null>;
}

export interface ThesisRepository {
  save(record: ThesisRecord): Promise<void>;
  getLatest(stockId: string): Promise<ThesisRecord | null>;
}

export interface ValuationRepository {
  save(snapshot: ValuationSnapshot): Promise<void>;
  getLatest(stockId: string): Promise<ValuationSnapshot | null>;
}
