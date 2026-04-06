import { DefaultDatasetRouter } from '../modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../modules/budget/RateBudgetGuard.js';
import { DefaultRuleEngine, DefaultRuleRegistry } from '../modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule, ThesisBrokenRule } from '../modules/rules/RiskRules.js';
import { CandidatePoolAddRule } from '../modules/rules/StrategyRules.js';
import { CustomStock1513RangeRule } from '../modules/rules/CustomOverrides.js';

export function bootstrap() {
  const router = new DefaultDatasetRouter();
  const budgetGuard = new RateBudgetGuard();
  
  const ruleRegistry = new DefaultRuleRegistry();
  ruleRegistry.register(new AbsoluteStopLossRule());
  ruleRegistry.register(new ThesisBrokenRule());
  ruleRegistry.register(new CandidatePoolAddRule());
  ruleRegistry.register(new CustomStock1513RangeRule());
  
  const ruleEngine = new DefaultRuleEngine(ruleRegistry);

  return {
    router,
    budgetGuard,
    ruleRegistry,
    ruleEngine
  };
}
