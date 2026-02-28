import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const apiRoot = resolve(__dirname, '../../..');

let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;

export async function setup() {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('babloo_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const url = container.getConnectionUri();

  // Push the Prisma schema to the ephemeral database
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });

  // Make DATABASE_URL available to all tests via env
  process.env.DATABASE_URL = url;

  // Store container ref for teardown
  (globalThis as any).__TESTCONTAINER__ = container;
}

export async function teardown() {
  const c = (globalThis as any).__TESTCONTAINER__;
  if (c) await c.stop();
}
