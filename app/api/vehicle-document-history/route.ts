import { listAllVehicleDocumentHistory } from '@/db/vehicleDocuments';
import { captureHandledError } from '@/utils/sentry';
import { NextRequest } from 'next/server';

import { VehicleDocumentHistoryEvent } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const eventType = request.nextUrl.searchParams.get('eventType') as VehicleDocumentHistoryEvent | null;
    const history = await listAllVehicleDocumentHistory(eventType || undefined);

    return Response.json({ history });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-document-history.listAll',
      route: '/api/vehicle-document-history',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
