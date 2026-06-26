import { createVehicleDocuments, listVehicleDocuments } from '@/db/vehicleDocuments';
import { requireAuth } from '@/utils/auth';
import type { VehicleDocument } from '@/types';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await listVehicleDocuments();

    return Response.json({ documents });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-documents.list',
      route: '/api/vehicle-documents',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}

type VehicleDocumentsPostPayload = {
  documents?: unknown;
  actor?: unknown;
  source?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    const payload = await request.json() as VehicleDocumentsPostPayload;

    if (!Array.isArray(payload.documents)) {
      return Response.json({ error: 'documents must be an array.' }, { status: 400 });
    }

    const documents = await createVehicleDocuments(payload.documents as VehicleDocument[], {
      actor: auth.actor as string,
      historyDetails: {
        source: typeof payload.source === 'string' ? payload.source : 'document_import',
        importedCount: payload.documents.length,
      },
    });

    return Response.json({ documents }, { status: 201 });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-documents.create',
      route: '/api/vehicle-documents',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
