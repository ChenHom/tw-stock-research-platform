import { DefaultDatasetRouter } from '../modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../modules/budget/RateBudgetGuard.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule, ThesisBrokenRule } from '../modules/rules/RiskRules.js';
import { CandidatePoolAddRule } from '../modules/rules/StrategyRules.js';
import { CustomStock1513RangeRule } from '../modules/rules/CustomOverrides.js';
import { TwseOpenApiProvider } from '../modules/providers/twse/TwseOpenApiProvider.js';
import { FeatureBuilder } from '../modules/features/FeatureBuilder.js';
import { ThesisTracker } from '../modules/research/ThesisTracker.js';
import { DecisionComposer } from '../modules/research/DecisionComposer.js';
import { MemoryCacheStore } from '../modules/cache/CacheEnvelope.js';

export function bootstrap() {
  const cache = new MemoryCacheStore();
  const router = new DefaultDatasetRouter();
  const budgetGuard = new RateBudgetGuard();
  const featureBuilder = new FeatureBuilder();
  const thesisTracker = new ThesisTracker();
  const decisionComposer = new DecisionComposer();
  
  // 註冊 Providers (注入快取)
  const twseProvider = new TwseOpenApiProvider(cache);

  // 註冊規則
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new AbsoluteStopLossRule());
  ruleRegistry.register(new ThesisBrokenRule());
  ruleRegistry.register(new CandidatePoolAddRule());
  ruleRegistry.register(new CustomStock1513RangeRule());
  
  const ruleEngine = new DefaultRuleEngine(ruleRegistry);

  return {
    router,
    budgetGuard,
    featureBuilder,
    thesisTracker,
    decisionComposer,
    ruleRegistry,
    ruleEngine,
    providers: {
      twse: twseProvider
    }
  };
}
