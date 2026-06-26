import { getDb } from '@/db';
import { sql } from 'drizzle-orm';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HealthCheckRow = {
  now: string | Date;
};

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute(sql`select now() as now`);

    return Response.json({
      ok: true,
      now: result.rows[0]?.now,
    });
  } catch (error) {
    captureHandledError(error, {
      operation: 'database.health-check',
      route: '/api/db/health',
    });

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
