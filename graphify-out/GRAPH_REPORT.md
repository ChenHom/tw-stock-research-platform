# Graph Report - /home/hom/services/tw-stock-research-platform  (2026-04-14)

## Corpus Check
- 109 files · ~28,624 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 442 nodes · 566 edges · 69 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 1% AMBIGUOUS · INFERRED: 129 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Research Workflow|Research Workflow]]
- [[_COMMUNITY_Caching Layer|Caching Layer]]
- [[_COMMUNITY_Research Workflow|Research Workflow]]
- [[_COMMUNITY_Decision Thesis Evaluation|Decision Thesis Evaluation]]
- [[_COMMUNITY_Screening Budget Bulk|Screening Budget Bulk]]
- [[_COMMUNITY_Performance Loop|Performance Loop]]
- [[_COMMUNITY_Caching Layer|Caching Layer]]
- [[_COMMUNITY_Feature Snapshot Final|Feature Snapshot Final]]
- [[_COMMUNITY_Caching Layer|Caching Layer]]
- [[_COMMUNITY_Table Result Position|Table Result Position]]
- [[_COMMUNITY_Evaluate Supports Add|Evaluate Supports Add]]
- [[_COMMUNITY_Calculate Feature Score|Calculate Feature Score]]
- [[_COMMUNITY_Fetch Supports Fallback|Fetch Supports Fallback]]
- [[_COMMUNITY_Evaluate Supports Risk|Evaluate Supports Risk]]
- [[_COMMUNITY_Engine Get Constructor|Engine Get Constructor]]
- [[_COMMUNITY_Migration Manager Clear|Migration Manager Clear]]
- [[_COMMUNITY_Performance Loop|Performance Loop]]
- [[_COMMUNITY_Mock Constructor Fetch|Mock Constructor Fetch]]
- [[_COMMUNITY_Fin Mind Normalization|Fin Mind Normalization]]
- [[_COMMUNITY_Performance Loop|Performance Loop]]
- [[_COMMUNITY_Assertions Check Statistical|Assertions Check Statistical]]
- [[_COMMUNITY_Common Feature|Common Feature]]
- [[_COMMUNITY_Rss News Constructor|Rss News Constructor]]
- [[_COMMUNITY_Decision Composer Explanation|Decision Composer Explanation]]
- [[_COMMUNITY_Thesis Tracker Append|Thesis Tracker Append]]
- [[_COMMUNITY_Custom Stock1513range Evaluate|Custom Stock1513range Evaluate]]
- [[_COMMUNITY_Quality Guard Evaluate|Quality Guard Evaluate]]
- [[_COMMUNITY_Date Get Days|Date Get Days]]
- [[_COMMUNITY_Caching Layer|Caching Layer]]
- [[_COMMUNITY_Event Normalizer From|Event Normalizer From]]
- [[_COMMUNITY_Position Update Trailing|Position Update Trailing]]
- [[_COMMUNITY_Catalyst Calendar List|Catalyst Calendar List]]
- [[_COMMUNITY_Valuation|Valuation]]
- [[_COMMUNITY_Symbol Resolver Resolve|Symbol Resolver Resolve]]
- [[_COMMUNITY_Bootstrap|Bootstrap]]
- [[_COMMUNITY_Database Clear Cli|Database Clear Cli]]
- [[_COMMUNITY_Main Migrate|Main Migrate]]
- [[_COMMUNITY_Clear|Clear]]
- [[_COMMUNITY_Resolve Query Mode|Resolve Query Mode]]
- [[_COMMUNITY_Outcome|Outcome]]
- [[_COMMUNITY_Create Mock Core|Create Mock Core]]
- [[_COMMUNITY_E2e Smoke|E2e Smoke]]
- [[_COMMUNITY_Coverage Regression Backlog|Coverage Regression Backlog]]
- [[_COMMUNITY_Migration Cli Postgre|Migration Cli Postgre]]
- [[_COMMUNITY_feature|feature]]
- [[_COMMUNITY_pipeline|pipeline]]
- [[_COMMUNITY_provider|provider]]
- [[_COMMUNITY_repository|repository]]
- [[_COMMUNITY_router|router]]
- [[_COMMUNITY_rule|rule]]
- [[_COMMUNITY_storage|storage]]
- [[_COMMUNITY_market|market]]
- [[_COMMUNITY_assertions.test|assertions.test]]
- [[_COMMUNITY_cache-key-factory.test|cache-key-factory.test]]
- [[_COMMUNITY_candidate-research-service.test|candidate-research-service.test]]
- [[_COMMUNITY_decision-composer.test|decision-composer.test]]
- [[_COMMUNITY_env-check.test|env-check.test]]
- [[_COMMUNITY_feature-builder.test|feature-builder.test]]
- [[_COMMUNITY_position-action-family.test|position-action-family.test]]
- [[_COMMUNITY_research-performance-service.test|research-performance-service.test]]
- [[_COMMUNITY_research-range-service.test|research-range-service.test]]
- [[_COMMUNITY_research-run-query-service.test|research-run-query-service.test]]
- [[_COMMUNITY_research-run-query.test|research-run-query.test]]
- [[_COMMUNITY_router.test|router.test]]
- [[_COMMUNITY_run-id-resolver.test|run-id-resolver.test]]
- [[_COMMUNITY_symbol-resolver.test|symbol-resolver.test]]
- [[_COMMUNITY_Position Service|Position Service]]
- [[_COMMUNITY_Symbol Resolver|Symbol Resolver]]
- [[_COMMUNITY_FinMind Async Batch Query|FinMind Async Batch Query]]

## God Nodes (most connected - your core abstractions)
1. `CandidateResearchService` - 16 edges
2. `FinMind Provider` - 14 edges
3. `ResearchOutcomeService` - 12 edges
4. `ResearchPerformanceService` - 12 edges
5. `Feature Builder` - 12 edges
6. `FeatureBuilder` - 11 edges
7. `TW Stock Research Platform` - 11 edges
8. `ResearchInsightsService` - 11 edges
9. `Rule Evaluation Phase Ordering` - 10 edges
10. `Research Pipeline Service` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ResearchOutcomeService` --conceptually_related_to--> `Provider Order Policy`  [AMBIGUOUS]
  src/app/services/ResearchOutcomeService.ts → docs/provider-capability-matrix.md
- `Mixed MVP Sample Set` --conceptually_related_to--> `CandidateResearchService`  [INFERRED]
  docs/mvp-test-plan.md → src/app/services/CandidateResearchService.ts
- `Provider Order Policy` --conceptually_related_to--> `DatasetRouter`  [INFERRED]
  docs/provider-capability-matrix.md → src/core/contracts/router.ts
- `stock_news Dataset` --references--> `FinMind TaiwanStockNews Dataset`  [INFERRED]
  src/config/datasets.ts → finmind-llms-full.txt
- `News-as-event-only Rationale` --rationale_for--> `Feature Builder`  [INFERRED]
  README.md → src/modules/features/FeatureBuilder.ts

## Hyperedges (group relationships)
- **Research Closed Loop** — readme_screening_stage, readme_research_stage, readme_features_stage, readme_decision_stage, readme_outcome_stage, readme_performance_stage, readme_insights_stage [EXTRACTED 1.00]
- **Official-first Data Source Stack** — readme_twse_source, readme_finmind_source, readme_news_event_bonus [EXTRACTED 1.00]
- **Decision Composition Stack** — readme_features_stage, readme_rule_engine_concept, readme_thesis_concept, readme_decision_composer_concept, readme_decision_stage [EXTRACTED 1.00]
- **Candidate Research Execution Flow** — run_candidates_cli, candidate_research_service, screening_service, research_pipeline_service [EXTRACTED 1.00]
- **Batch Validation Flow** — run_batch_cli, candidate_research_service, research_outcome_service, research_performance_service, research_insights_service, batch_validation_harness [EXTRACTED 1.00]
- **Analytics CLI Flow** — run_performance_cli, run_insights_cli, run_id_resolver, research_performance_service, research_insights_service [INFERRED 0.84]
- **Research Feedback Loop** — candidateresearchservice_candidateresearchservice, researchoutcomeservice_researchoutcomeservice, researchperformanceservice_researchperformanceservice, researchinsightsservice_researchinsightsservice, architecture_data_loop [EXTRACTED 1.00]
- **Candidate Run Persistence Pipeline** — candidateresearchservice_candidateresearchservice, storage_researchrunrepository, storage_researchrun, storage_candidateresearchresultrecord [INFERRED 0.89]
- **Attribution Analytics Pipeline** — researchperformanceservice_researchperformanceservice, storage_researchoutcome, storage_candidateresearchresultrecord, researchperformanceservice_rulebreakdown, researchperformanceservice_thesisbreakdown [INFERRED 0.86]
- **Rule to Decision Pipeline** — ruleengine_default_rule_engine, filterrules_data_quality_guard_rule, riskrules_absolute_stop_loss_rule, riskrules_thesis_broken_rule, riskrules_risk_block_rule, strategyrules_buy_setup_rule, strategyrules_add_on_strength_rule, strategyrules_trend_weakening_rule, decisioncomposer_decision_composer [INFERRED 0.86]
- **Repository Backend Parity** — postgresrepos_postgres_feature_snapshot_repository, inmemoryrepos_inmemory_feature_snapshot_repository, postgresrepos_postgres_final_decision_repository, inmemoryrepos_inmemory_final_decision_repository, postgresrepos_postgres_research_run_repository, inmemoryrepos_inmemory_research_run_repository, postgresrepos_postgres_research_outcome_repository, inmemoryrepos_inmemory_research_outcome_repository [INFERRED 0.90]
- **Research Feedback Loop** — candidatereport_candidate_research_report_generator, performance_report_performance_report_generator, insights_report_insights_report_generator, assertions_research_assertions [INFERRED 0.78]
- **Provider Cache Flow** — cachekeyfactory_cache_key_factory, cacheenvelope_cache_envelope, rediscachestore_redis_cache_store, finmindprovider_finmind_provider, twseopenapiprovider_twse_open_api_provider [EXTRACTED 1.00]
- **Routing and Degradation Stack** — datasets_dataset_capabilities, ratebudgetguard_rate_budget_guard, datasetrouter_default_dataset_router, providerregistry_provider_registry, bootstrap_application_bootstrap [INFERRED 0.86]
- **Feature Input Stack** — featurebuilder_feature_builder, datasets_market_daily_latest, datasets_market_daily_history, datasets_financial_statements, datasets_month_revenue, datasets_stock_news [EXTRACTED 1.00]

## Communities

### Community 0 - "Research Workflow"
Cohesion: 0.11
Nodes (42): Layered architecture is chosen to enable an automated closed research loop, Research-Outcome-Performance-Insights Data Loop, Orchestration Layer, Performance & Insights Layer, CandidateResearchService, ThesisStatus, FeatureSnapshot, StockFeatureSet (+34 more)

### Community 1 - "Caching Layer"
Cohesion: 0.08
Nodes (40): Application Bootstrap, Cache Envelope, Cache Store Contract, Memory Cache Store, Cache Key Factory, Default Dataset Router, daily_valuation Dataset, Dataset Capabilities Matrix (+32 more)

### Community 2 - "Research Workflow"
Cohesion: 0.07
Nodes (34): Condition-based Decisions Rationale, daily_valuation Dataset, Decision Composer, Decision Stage, eventScore Feature, Evidence Threshold Before Reweighting, Features Stage, financial_statements Dataset (+26 more)

### Community 3 - "Decision Thesis Evaluation"
Cohesion: 0.16
Nodes (25): Stock 1513 Range Override Rule, Decision Action Priority Model, Decision Confidence Scoring, Decision Composer, Decision Explanation Builder, Filter Locking Override, Position Mode Guardrail, Critical Missing Field Set (+17 more)

### Community 4 - "Screening Budget Bulk"
Cohesion: 0.13
Nodes (23): Budget-Aware Routing Degrade Policy, Bulk Screening First Layer, Candidate Research Service, Default Dataset Router, FinMind Provider, FinMind Provider Normalization Test, Historical research uses exact-date snapshots plus extended lookbacks for revenue and financial context, Point-in-Time Research Mode (+15 more)

### Community 5 - "Performance Loop"
Cohesion: 0.15
Nodes (21): Cross-Day MVP Batch Validation Harness, Optimization suggestions require at least 10 evaluable samples before ranking rules, Outcome Alpha Scoring, Performance Breakdown Metrics, Postgres Research Run Repository, Research Insights Service, Research Insights Optimization Test, Research Outcome Service (+13 more)

### Community 6 - "Caching Layer"
Cohesion: 0.21
Nodes (16): Caching and quota guards are used to preserve API budget across providers, Layered Architecture, Data Providers Layer, RateBudgetGuard, Redis Cache, AccountTier, QueryMode, DataProvider (+8 more)

### Community 7 - "Feature Snapshot Final"
Cohesion: 0.19
Nodes (16): Candidate Research Report Generator, Candidate Research View Model, Research Scoring Weights Rationale, Catalyst Calendar, Clear Research Data Utility, In-Memory Feature Snapshot Repository, In-Memory Final Decision Repository, In-Memory Research Outcome Repository (+8 more)

### Community 8 - "Caching Layer"
Cohesion: 0.18
Nodes (2): MemoryCacheStore, RedisCacheStore

### Community 9 - "Table Result Position"
Cohesion: 0.15
Nodes (15): Candidate Research Report Test, Candidate Markdown Renderer, Candidate Markdown Table Builder, Run Result Table Builder, Candidate Summary JSON Builder, Candidate Research View Model, Research Score Weighting Rationale, In-Memory Research Run Repository (+7 more)

### Community 10 - "Evaluate Supports Add"
Cohesion: 0.15
Nodes (4): AddOnStrengthRule, BuySetupRule, CandidatePoolAddRule, TrendWeakeningRule

### Community 11 - "Calculate Feature Score"
Cohesion: 0.3
Nodes (1): FeatureBuilder

### Community 12 - "Fetch Supports Fallback"
Cohesion: 0.17
Nodes (4): EmptyPrimaryProvider, FallbackFinMindProvider, HistoricalFinMindProvider, HistoricalTwseProvider

### Community 13 - "Evaluate Supports Risk"
Cohesion: 0.2
Nodes (3): AbsoluteStopLossRule, RiskBlockRule, ThesisBrokenRule

### Community 14 - "Engine Get Constructor"
Cohesion: 0.28
Nodes (2): DefaultRuleEngine, DefaultRuleRegistry

### Community 15 - "Migration Manager Clear"
Cohesion: 0.33
Nodes (1): MigrationManager

### Community 16 - "Performance Loop"
Cohesion: 0.25
Nodes (9): Research Assertions, Statistical Significance Gate, Validation Window Policy, Insights Report Generator, Performance Report Generator, Performance Success Metrics Rationale, Run ID Resolver, Run Label Builder (+1 more)

### Community 17 - "Mock Constructor Fetch"
Cohesion: 0.25
Nodes (1): MockProvider

### Community 18 - "Fin Mind Normalization"
Cohesion: 0.29
Nodes (7): FinMind Provider Normalization Test, FinMind Dataset Routing, FinMind Fetch Method, Free-tier Single-stock Guard, FinMind Normalize Method, FinMind Provider, Provider Registry

### Community 19 - "Performance Loop"
Cohesion: 0.29
Nodes (7): Insights Report Formatting Test, Backtest-based Guidance Rationale, Insights Markdown Builder, Optimization Suggestion Severity Formatting, Performance Report Formatting Test, Performance Markdown Builder, Success Metrics Rationale

### Community 20 - "Assertions Check Statistical"
Cohesion: 0.5
Nodes (1): ResearchAssertions

### Community 21 - "Common Feature"
Cohesion: 0.4
Nodes (0): 

### Community 22 - "Rss News Constructor"
Cohesion: 0.4
Nodes (1): RssNewsProvider

### Community 23 - "Decision Composer Explanation"
Cohesion: 0.6
Nodes (1): DecisionComposer

### Community 24 - "Thesis Tracker Append"
Cohesion: 0.4
Nodes (1): ThesisTracker

### Community 25 - "Custom Stock1513range Evaluate"
Cohesion: 0.5
Nodes (1): CustomStock1513RangeRule

### Community 26 - "Quality Guard Evaluate"
Cohesion: 0.5
Nodes (1): DataQualityGuardRule

### Community 27 - "Date Get Days"
Cohesion: 1.0
Nodes (2): getDaysAgo(), toTaipeiDateString()

### Community 28 - "Caching Layer"
Cohesion: 0.67
Nodes (1): CacheKeyFactory

### Community 29 - "Event Normalizer From"
Cohesion: 0.67
Nodes (1): EventNormalizer

### Community 30 - "Position Update Trailing"
Cohesion: 0.67
Nodes (1): PositionService

### Community 31 - "Catalyst Calendar List"
Cohesion: 0.67
Nodes (1): CatalystCalendar

### Community 32 - "Valuation"
Cohesion: 0.67
Nodes (1): ValuationService

### Community 33 - "Symbol Resolver Resolve"
Cohesion: 0.67
Nodes (1): SymbolResolver

### Community 34 - "Bootstrap"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Database Clear Cli"
Cohesion: 1.0
Nodes (2): Database Clear CLI, Research Data Reset Operation

### Community 36 - "Main Migrate"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Clear"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Resolve Query Mode"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Outcome"
Cohesion: 1.0
Nodes (2): In-Memory Research Outcome Repository, Postgres Research Outcome Repository

### Community 40 - "Create Mock Core"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "E2e Smoke"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Coverage Regression Backlog"
Cohesion: 1.0
Nodes (2): Regression Coverage Backlog, Unimplemented Test Coverage Gaps

### Community 43 - "Migration Cli Postgre"
Cohesion: 1.0
Nodes (2): Migration CLI, PostgreSQL Migration Workflow

### Community 44 - "feature"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "pipeline"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "provider"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "repository"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "router"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "rule"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "storage"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "market"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "assertions.test"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "cache-key-factory.test"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "candidate-research-service.test"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "decision-composer.test"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "env-check.test"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "feature-builder.test"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "position-action-family.test"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "research-performance-service.test"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "research-range-service.test"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "research-run-query-service.test"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "research-run-query.test"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "router.test"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "run-id-resolver.test"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "symbol-resolver.test"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Position Service"
Cohesion: 1.0
Nodes (1): Position Service

### Community 67 - "Symbol Resolver"
Cohesion: 1.0
Nodes (1): Symbol Resolver

### Community 68 - "FinMind Async Batch Query"
Cohesion: 1.0
Nodes (1): FinMind Async Batch Query

## Ambiguous Edges - Review These
- `ResearchOutcomeService` → `Provider Order Policy`  [AMBIGUOUS]
  src/app/services/ResearchOutcomeService.ts · relation: conceptually_related_to
- `ThesisStatus` → `thesis_met status heuristic`  [AMBIGUOUS]
  src/app/services/ResearchInsightsService.ts · relation: conceptually_related_to
- `Research Scoring Weights Rationale` → `Catalyst Calendar`  [AMBIGUOUS]
  src/modules/research/CatalystCalendar.ts · relation: conceptually_related_to
- `RSS News Provider` → `Default Dataset Router`  [AMBIGUOUS]
  src/config/datasets.ts · relation: conceptually_related_to

## Knowledge Gaps
- **83 isolated node(s):** `Database Clear CLI`, `Research Data Reset Operation`, `Run Candidates CLI`, `Run History CLI`, `Optimization suggestions require at least 10 evaluable samples before ranking rules` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Bootstrap`** (2 nodes): `bootstrap()`, `bootstrap.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Clear Cli`** (2 nodes): `Database Clear CLI`, `Research Data Reset Operation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Migrate`** (2 nodes): `main()`, `migrate.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Clear`** (2 nodes): `clearResearchData()`, `clear-research-data.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Resolve Query Mode`** (2 nodes): `resolveQueryMode()`, `datasets.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Outcome`** (2 nodes): `In-Memory Research Outcome Repository`, `Postgres Research Outcome Repository`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Mock Core`** (2 nodes): `createMockRule()`, `core-modules.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2e Smoke`** (2 nodes): `run()`, `e2e-smoke.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Coverage Regression Backlog`** (2 nodes): `Regression Coverage Backlog`, `Unimplemented Test Coverage Gaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Migration Cli Postgre`** (2 nodes): `Migration CLI`, `PostgreSQL Migration Workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `feature`** (1 nodes): `feature.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `pipeline`** (1 nodes): `pipeline.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `provider`** (1 nodes): `provider.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `repository`** (1 nodes): `repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `router`** (1 nodes): `router.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `rule`** (1 nodes): `rule.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `storage`** (1 nodes): `storage.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `market`** (1 nodes): `market.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `assertions.test`** (1 nodes): `assertions.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `cache-key-factory.test`** (1 nodes): `cache-key-factory.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `candidate-research-service.test`** (1 nodes): `candidate-research-service.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `decision-composer.test`** (1 nodes): `decision-composer.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `env-check.test`** (1 nodes): `env-check.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `feature-builder.test`** (1 nodes): `feature-builder.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `position-action-family.test`** (1 nodes): `position-action-family.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `research-performance-service.test`** (1 nodes): `research-performance-service.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `research-range-service.test`** (1 nodes): `research-range-service.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `research-run-query-service.test`** (1 nodes): `research-run-query-service.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `research-run-query.test`** (1 nodes): `research-run-query.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `router.test`** (1 nodes): `router.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `run-id-resolver.test`** (1 nodes): `run-id-resolver.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `symbol-resolver.test`** (1 nodes): `symbol-resolver.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Position Service`** (1 nodes): `Position Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Symbol Resolver`** (1 nodes): `Symbol Resolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinMind Async Batch Query`** (1 nodes): `FinMind Async Batch Query`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ResearchOutcomeService` and `Provider Order Policy`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `ThesisStatus` and `thesis_met status heuristic`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Research Scoring Weights Rationale` and `Catalyst Calendar`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `RSS News Provider` and `Default Dataset Router`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Decision Composer` connect `Decision Thesis Evaluation` to `Feature Snapshot Final`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Candidate Research Report Generator` connect `Feature Snapshot Final` to `Decision Thesis Evaluation`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `CandidateResearchService` (e.g. with `RunResearchInput` and `Parallel Batch Research Goal`) actually correct?**
  _`CandidateResearchService` has 4 INFERRED edges - model-reasoned connections that need verification._