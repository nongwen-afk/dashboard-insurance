import { createVehicleDocuments, listVehicleDocuments } from '@/db/vehicleDocuments';
import type { VehicleDocument } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await listVehicleDocuments();

    return Response.json({ documents });
  } catch (error) {
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
    const payload = await request.json() as VehicleDocumentsPostPayload;

    if (!Array.isArray(payload.documents)) {
      return Response.json({ error: 'documents must be an array.' }, { status: 400 });
    }

    const documents = await createVehicleDocuments(payload.documents as VehicleDocument[], {
      actor: typeof payload.actor === 'string' ? payload.actor : 'testuser',
      historyDetails: {
        source: typeof payload.source === 'string' ? payload.source : 'document_import',
        importedCount: payload.documents.length,
      },
    });

    return Response.json({ documents }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
