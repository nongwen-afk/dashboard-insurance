import { getSql } from '@/db';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HealthCheckRow = {
  now: string | Date;
};

export async function GET() {
  try {
    const sql = getSql();
    const result = await sql`select now() as now` as HealthCheckRow[];

    return Response.json({
      ok: true,
      now: result[0]?.now,
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
