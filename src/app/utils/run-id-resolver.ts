import { toTaipeiDateString } from '../../core/utils/date.js';
import type { ResearchRunQueryService } from '../services/ResearchRunQueryService.js';

type RunQueryServiceLike = Pick<ResearchRunQueryService, 'getLatestRunSummary' | 'findRunsByDate'>;

function parseExplicitRunIds(parts: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      parts
        .flatMap(part => (part || '').split(','))
        .map(part => part.trim())
        .filter(part => part.length > 0)
    )
  );
}

export async function resolveRunIds(
  mode: string,
  param: string | undefined,
  queryService: RunQueryServiceLike,
  extraArgs: string[] = []
): Promise<string[]> {
  if (mode === 'runs') {
    return parseExplicitRunIds([param, ...extraArgs]);
  }

  if (mode === 'latest') {
    const latest = await queryService.getLatestRunSummary();
    return latest?.run.runId ? [latest.run.runId] : [];
  }

  if (mode === 'range') {
    const startDate = param;
    const endDate = extraArgs[0];
    if (!startDate || !endDate) {
      return [];
    }

    const runIds: string[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = toTaipeiDateString(current);
      const runs = await queryService.findRunsByDate(dateStr);
      runIds.push(...runs.map(run => run.runId));
      current.setDate(current.getDate() + 1);
    }

    return Array.from(new Set(runIds));
  }

  return parseExplicitRunIds([mode, param, ...extraArgs]);
}

export function buildRunLabel(runIds: string[]): string {
  return runIds.length === 1 ? runIds[0] : `BATCH (${runIds.length} runs)`;
}
