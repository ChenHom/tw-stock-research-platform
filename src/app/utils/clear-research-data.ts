import { createSqlContext } from '../../modules/storage/SqlContext.js';

export async function clearResearchData() {
  const sql = createSqlContext();

  try {
    await sql.unsafe('TRUNCATE research_runs, candidate_research_results, research_outcomes, feature_snapshots, final_decisions CASCADE');
  } finally {
    await sql.end();
  }
}
