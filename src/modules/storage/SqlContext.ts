import postgres from 'postgres';

export function createSqlContext() {
  const dbUser = process.env.DB_USER || 'researcher';
  const dbPass = process.env.DB_PASSWORD || 'research_pass';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'tw_stock_research';

  const connectionUrl = `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  return postgres(connectionUrl);
}
