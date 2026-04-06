# Provider Capability Matrix

| Dataset | Source of Truth | Provider Order | Free Tier Mode | Premium Mode | Notes |
|---|---|---|---|---|---|
| market_daily | TWSE | twse -> finmind | bulk via TWSE | same | 全市場先靠官方 |
| daily_valuation | TWSE | twse -> finmind | bulk via TWSE | same | PER/PBR/殖利率 |
| month_revenue | FinMind / MOPS | finmind -> official_backfill | per_stock | bulk_by_date | Free 不要全市場逐檔掃 |
| financial_statements | FinMind / MOPS | finmind -> official_backfill | per_stock | bulk_by_date | 季更新 |
| balance_sheet | FinMind / MOPS | finmind -> official_backfill | per_stock | bulk_by_date | 季更新 |
| cashflow | FinMind / MOPS | finmind -> official_backfill | per_stock | bulk_by_date | 季更新 |
| institutional_flow | FinMind | finmind -> official_backfill | per_stock | bulk_by_date | 候選池補強 |
| margin_short | FinMind | finmind -> official_backfill | per_stock | bulk_by_date | 候選池補強 |
| securities_lending | FinMind | finmind | per_stock | bulk_by_date | 候選池補強 |
| futures_daily | FinMind / TAIFEX | finmind -> official_backfill | daily | same | 大盤風險 |
| options_daily | FinMind / TAIFEX | finmind -> official_backfill | daily | same | 事件風險 |
| stock_news | FinMind / RSS | finmind -> google_rss -> yahoo_rss | keyword based | same | 只當線索 |
| realtime_quote | TWSE realtime / premium data | twse_realtime -> finmind_realtime | disabled | enabled | MVP 先關閉 |
