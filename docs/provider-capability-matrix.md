# Provider Capability Matrix

| Dataset | Source of Truth | Provider Order | Free Tier Mode | Notes |
|---|---|---|---|---|
| market_daily_latest | TWSE | twse -> finmind | bulk via TWSE | 全市場當日快照 |
| market_daily_history | FinMind | finmind | per_stock | 歷史序列，計算 MA 用 |
| daily_valuation | TWSE | twse -> finmind | bulk via TWSE | 估值快照 (PER/PBR) |
| month_revenue | FinMind | finmind | per_stock | 月營收成長率 |
| institutional_flow | FinMind | finmind | per_stock | 三大法人買賣超 |
| margin_short | FinMind | finmind | per_stock | 融資融券餘額 |
| financial_statements | FinMind | finmind | per_stock | 季度損益表 |
| stock_news | FinMind / RSS | finmind -> google_rss | keyword | 輔助線索 |

### 認證說明
- **FinMind**: 必須使用 `Authorization: Bearer {token}` Header。
- **Rate Limit**: 帶 Token 為 600 req/hr。
- **Free Tier**: 嚴格執行 `per_stock` 模式，不支援 bulk 歷史抓取。
