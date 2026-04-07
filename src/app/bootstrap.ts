import { DefaultDatasetRouter } from '../modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../modules/budget/RateBudgetGuard.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule, ThesisBrokenRule } from '../modules/rules/RiskRules.js';
import { CandidatePoolAddRule } from '../modules/rules/StrategyRules.js';
import { CustomStock1513RangeRule } from '../modules/rules/CustomOverrides.js';
import { TwseOpenApiProvider } from '../modules/providers/twse/TwseOpenApiProvider.js';
import { FinMindProvider } from '../modules/providers/finmind/FinMindProvider.js';
import { ProviderRegistry } from '../modules/providers/ProviderRegistry.js';
import { FeatureBuilder } from '../modules/features/FeatureBuilder.js';
import { ThesisTracker } from '../modules/research/ThesisTracker.js';
import { DecisionComposer } from '../modules/research/DecisionComposer.js';
import { MemoryCacheStore } from '../modules/cache/CacheEnvelope.js';
import { InMemoryFeatureSnapshotRepository, InMemoryFinalDecisionRepository } from '../modules/storage/InMemoryRepositories.js';
import { ResearchPipelineService } from './services/ResearchPipelineService.js';

export function bootstrap() {
  const cache = new MemoryCacheStore();
  const router = new DefaultDatasetRouter();
  const budgetGuard = new RateBudgetGuard();
  const featureBuilder = new FeatureBuilder();
  const thesisTracker = new ThesisTracker();
  const decisionComposer = new DecisionComposer();
  
  // 1. 存儲層
  const featureSnapshotRepo = new InMemoryFeatureSnapshotRepository();
  const finalDecisionRepo = new InMemoryFinalDecisionRepository();

  // 2. 資料來源層
  const twseProvider = new TwseOpenApiProvider(cache);
  const finmindProvider = new FinMindProvider(cache);
  const providerRegistry = new ProviderRegistry([twseProvider, finmindProvider]);

  // 3. 規則引擎層
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new AbsoluteStopLossRule());
  ruleRegistry.register(new ThesisBrokenRule());
  ruleRegistry.register(new CandidatePoolAddRule());
  ruleRegistry.register(new CustomStock1513RangeRule());
  
  const ruleEngine = new DefaultRuleEngine(ruleRegistry);

  // 4. 核心流程層 (Orchestration)
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

  return {
    cache,
    router,
    budgetGuard,
    featureBuilder,
    thesisTracker,
    decisionComposer,
    ruleRegistry,
    ruleEngine,
    providers: {
      twse: twseProvider,
      finmind: finmindProvider
    },
    providerRegistry,
    repositories: {
      featureSnapshots: featureSnapshotRepo,
      finalDecisions: finalDecisionRepo
    },
    researchPipeline
  };
}
