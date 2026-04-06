import { DefaultDatasetRouter } from '../modules/router/DatasetRouter.js';
import { RateBudgetGuard } from '../modules/budget/RateBudgetGuard.js';
import { RuleEngine } from '../modules/rules/RuleEngine.js';
import { AbsoluteStopLossRule, ThesisBrokenRule } from '../modules/rules/RiskRules.js';
import { CandidatePoolAddRule } from '../modules/rules/StrategyRules.js';
import { CustomStock1513RangeRule } from '../modules/rules/CustomOverrides.js';

export function bootstrap() {
  const router = new DefaultDatasetRouter();
  const budgetGuard = new RateBudgetGuard();
  const ruleEngine = new RuleEngine([
    new AbsoluteStopLossRule(),
    new ThesisBrokenRule(),
    new CandidatePoolAddRule(),
    new CustomStock1513RangeRule()
  ]);

  return {
    router,
    budgetGuard,
    ruleEngine
  };
}
