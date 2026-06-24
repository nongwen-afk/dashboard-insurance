import { listVehicleDocumentHistory, recordVehicleDocumentHistoryForId } from '@/db/vehicleDocuments';
import type { VehicleDocumentHistoryEvent } from '@/types';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VehicleDocumentHistoryPayload = {
  eventType?: unknown;
  actor?: unknown;
  details?: unknown;
};

const supportedEventTypes = new Set<VehicleDocumentHistoryEvent>([
  'sync_no_update',
  'updated',
]);

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const history = await listVehicleDocumentHistory(id);

    return Response.json({ history });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-document-history.list',
      route: '/api/vehicle-documents/[id]/history',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const payload = await request.json() as VehicleDocumentHistoryPayload;

    if (typeof payload.eventType !== 'string' || !supportedEventTypes.has(payload.eventType as VehicleDocumentHistoryEvent)) {
      return Response.json({ error: 'Unsupported history event type.' }, { status: 400 });
    }

    const result = await recordVehicleDocumentHistoryForId(id, payload.eventType as VehicleDocumentHistoryEvent, {
      actor: typeof payload.actor === 'string' ? payload.actor : 'testuser',
      historyDetails: typeof payload.details === 'object' && payload.details !== null ? payload.details as Record<string, unknown> : undefined,
    });

    if (!result) {
      return Response.json({ error: 'Vehicle document not found.' }, { status: 404 });
    }

    return Response.json({
      document: result.document,
      logged: result.isRecorded,
    });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-document-history.create',
      route: '/api/vehicle-documents/[id]/history',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
