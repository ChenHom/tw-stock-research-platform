import { DefaultDatasetRouter } from '../modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../modules/budget/RateBudgetGuard.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule, ThesisBrokenRule, RiskBlockRule } from '../modules/rules/RiskRules.js';
import { DataQualityGuardRule } from '../modules/rules/FilterRules.js';
import { AddOnStrengthRule, CandidatePoolAddRule, BuySetupRule, TrendWeakeningRule } from '../modules/rules/StrategyRules.js';
import { CustomStock1513RangeRule } from '../modules/rules/CustomOverrides.js';
import { TwseOpenApiProvider } from '../modules/providers/twse/TwseOpenApiProvider.js';
import { FinMindProvider } from '../modules/providers/finmind/FinMindProvider.js';
import { ProviderRegistry } from '../modules/providers/ProviderRegistry.js';
import { FeatureBuilder } from '../modules/features/FeatureBuilder.js';
import { ThesisTracker } from '../modules/research/ThesisTracker.js';
import { DecisionComposer } from '../modules/research/DecisionComposer.js';
import { RedisCacheStore } from '../modules/cache/RedisCacheStore.js';
import { MemoryCacheStore } from '../modules/cache/CacheEnvelope.js';
import { 
  PostgresFeatureSnapshotRepository, 
  PostgresFinalDecisionRepository, 
  PostgresResearchRunRepository,
  PostgresResearchOutcomeRepository
} from '../modules/storage/PostgresRepositories.js';
import { 
  InMemoryFeatureSnapshotRepository, 
  InMemoryFinalDecisionRepository, 
  InMemoryResearchRunRepository,
  InMemoryResearchOutcomeRepository
} from '../modules/storage/InMemoryRepositories.js';
import { ResearchPipelineService } from './services/ResearchPipelineService.js';
import { createSqlContext } from '../modules/storage/SqlContext.js';
import { ScreeningService } from './services/ScreeningService.js';
import { CandidateResearchService } from './services/CandidateResearchService.js';
import { ResearchRunQueryService } from './services/ResearchRunQueryService.js';
import { ResearchOutcomeService } from './services/ResearchOutcomeService.js';
import { ResearchPerformanceService } from './services/ResearchPerformanceService.js';
import { ResearchRangeService } from './services/ResearchRangeService.js';
import { CandidateResearchReportGenerator } from '../modules/reporting/CandidateResearchReportGenerator.js';

export interface BootstrapOverrides {
  providers?: any[];
}

export function bootstrap(overrides?: BootstrapOverrides) {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || '6379';
  const cacheType = process.env.CACHE_TYPE || 'redis'; // 預設改為 redis
  
  let cache;
  if (cacheType === 'redis') {
    console.log(`[Bootstrap] 使用 Redis 快取層 (redis://${redisHost}:${redisPort})`);
    cache = new RedisCacheStore({ url: `redis://${redisHost}:${redisPort}` });
  } else {
    console.log('[Bootstrap] 使用 In-Memory 快取層');
    cache = new MemoryCacheStore();
  }

  const router = new DefaultDatasetRouter();
  const budgetGuard = new RateBudgetGuard();
  const featureBuilder = new FeatureBuilder();
  const thesisTracker = new ThesisTracker();
  const decisionComposer = new DecisionComposer();
  const candidateResearchReportGenerator = new CandidateResearchReportGenerator();

  // 1. 儲存層
  const storageType = process.env.STORAGE_TYPE || 'in-memory';
  let featureSnapshotRepo;
  let finalDecisionRepo;
  let researchRunRepo;
  let researchOutcomeRepo;
  let sql;

  if (storageType === 'postgres') {
    console.log('[Bootstrap] 使用 PostgreSQL 儲存層');
    sql = createSqlContext();
    featureSnapshotRepo = new PostgresFeatureSnapshotRepository(sql);
    finalDecisionRepo = new PostgresFinalDecisionRepository(sql);
    researchRunRepo = new PostgresResearchRunRepository(sql);
    researchOutcomeRepo = new PostgresResearchOutcomeRepository(sql);
  } else {
    console.log('[Bootstrap] 使用 In-Memory 儲存層');
    featureSnapshotRepo = new InMemoryFeatureSnapshotRepository();
    finalDecisionRepo = new InMemoryFinalDecisionRepository();
    researchRunRepo = new InMemoryResearchRunRepository();
    researchOutcomeRepo = new InMemoryResearchOutcomeRepository();
  }

  // 2. 資料來源層
  const defaultProviders = [
    new TwseOpenApiProvider(cache),
    new FinMindProvider(cache)
  ];
  const providers = overrides?.providers || defaultProviders;
  const providerRegistry = new ProviderRegistry(providers);

  // 3. 篩選與特徵層
  const screeningService = new ScreeningService(router, providerRegistry);

  // 4. 規則引擎層
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new DataQualityGuardRule());
  ruleRegistry.register(new AbsoluteStopLossRule());
  ruleRegistry.register(new ThesisBrokenRule());
  ruleRegistry.register(new RiskBlockRule());
  ruleRegistry.register(new CandidatePoolAddRule());
  ruleRegistry.register(new BuySetupRule());
  ruleRegistry.register(new AddOnStrengthRule());
  ruleRegistry.register(new TrendWeakeningRule());
  ruleRegistry.register(new CustomStock1513RangeRule());
  
  const ruleEngine = new DefaultRuleEngine(ruleRegistry);

  // 5. 核心流程層
  const researchPipeline = new ResearchPipelineService({
    router,
    providerRegistry,
    featureBuilder,
    ruleEngine,
    thesisTracker,
    decisionComposer,
    featureSnapshotRepository: featureSnapshotRepo,
    finalDecisionRepository: finalDecisionRepo
  });

  const candidateResearchService = new CandidateResearchService(
    screeningService, 
    researchPipeline,
    researchRunRepo
  );

  const researchRunQueryService = new ResearchRunQueryService(researchRunRepo);
  const researchOutcomeService = new ResearchOutcomeService(researchOutcomeRepo, researchRunRepo, providerRegistry);
  const researchPerformanceService = new ResearchPerformanceService(researchOutcomeRepo, researchRunRepo);
  const researchRangeService = new ResearchRangeService(researchPipeline);

  return {
    cache,
    router,
    budgetGuard,
    featureBuilder,
    thesisTracker,
    decisionComposer,
    screeningService,
    candidateResearchService,
    researchRunQueryService,
    researchOutcomeService,
    researchPerformanceService,
    researchRangeService,
    candidateResearchReportGenerator,
    ruleRegistry,
    ruleEngine,
    providers: {
      twse: providers.find(p => p.providerName === 'twse'),
      finmind: providers.find(p => p.providerName === 'finmind')
    },
    providerRegistry,
    repositories: {
      featureSnapshots: featureSnapshotRepo,
      finalDecisions: finalDecisionRepo,
      researchRuns: researchRunRepo,
      researchOutcomes: researchOutcomeRepo
    },
    researchPipeline
  };
}
