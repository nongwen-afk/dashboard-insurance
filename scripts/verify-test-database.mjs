import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
const expectedBranchId = process.env.TEST_DATABASE_BRANCH_ID;
const productionBranchId = process.env.PRODUCTION_DATABASE_BRANCH_ID;

if (!databaseUrl) {
  throw new Error('Missing TEST_DATABASE_URL GitHub secret.');
}

if (!expectedBranchId) {
  throw new Error('Missing TEST_DATABASE_BRANCH_ID GitHub secret.');
}

if (productionBranchId && expectedBranchId === productionBranchId) {
  throw new Error('Test and production Neon branch IDs must be different.');
}

const sql = neon(databaseUrl);
const [target] = await sql`
  select
    current_database() as database_name,
    current_setting('neon.project_id', true) as project_id,
    current_setting('neon.branch_id', true) as branch_id
`;

if (!target?.branch_id) {
  throw new Error('The configured test database is not a Neon branch.');
}

if (target.branch_id !== expectedBranchId) {
  throw new Error(
    `Refusing database operation: expected Neon branch ${expectedBranchId}, received ${target.branch_id}.`,
  );
}

console.log(
  `Verified non-production Neon target: project=${target.project_id}, branch=${target.branch_id}, database=${target.database_name}`,
);
