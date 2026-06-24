import { listVehicleDocumentRenewalHistory } from '@/db/vehicleDocuments';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const renewals = await listVehicleDocumentRenewalHistory();

    return Response.json({ renewals });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-document-renewals.list',
      route: '/api/vehicle-document-renewals',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
