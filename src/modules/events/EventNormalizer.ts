import type { NewsRow } from '../../core/types/market.js';

export interface NormalizedEvent {
  eventType: string;
  eventDate?: string;
  title: string;
  summary?: string;
  sourceSystem: string;
  relatedStockIds: string[];
  verified: boolean;
}

export class EventNormalizer {
  fromNews(news: NewsRow): NormalizedEvent {
    return {
      eventType: 'news',
      eventDate: news.publishedAt,
      title: news.title,
      summary: news.content,
      sourceSystem: 'news',
      relatedStockIds: news.relatedStockIds ?? [],
      verified: false
    };
  }
}
