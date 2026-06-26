import { deleteVehicleDocument, updateVehicleDocument } from '@/db/vehicleDocuments';
import { requireAuth } from '@/utils/auth';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VehicleDocumentPatchPayload = {
  issuedDate?: unknown;
  expiryDate?: unknown;
  isAcknowledged?: unknown;
  acknowledgedAt?: unknown;
  acknowledgedBy?: unknown;
  actor?: unknown;
};

const parseOptionalDate = (value: unknown) => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid acknowledgedAt value.');
  }

  return date;
};

const parseOptionalDateOnly = (value: unknown, fieldName: string) => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  if (value === '') return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName} value.`);
  }

  return value;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = requireAuth(request);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const payload = await request.json() as VehicleDocumentPatchPayload;
    const updates: Parameters<typeof updateVehicleDocument>[1] = {};

    if (typeof payload.isAcknowledged === 'boolean') {
      updates.isAcknowledged = payload.isAcknowledged;
    }

    if ('issuedDate' in payload) {
      updates.issuedDate = parseOptionalDateOnly(payload.issuedDate, 'issuedDate');
    }

    if ('expiryDate' in payload) {
      updates.expiryDate = parseOptionalDateOnly(payload.expiryDate, 'expiryDate');
    }

    if ('acknowledgedAt' in payload) {
      updates.acknowledgedAt = parseOptionalDate(payload.acknowledgedAt);
    }

    if ('acknowledgedBy' in payload) {
      if (payload.acknowledgedBy !== null && typeof payload.acknowledgedBy !== 'string') {
        throw new Error('Invalid acknowledgedBy value.');
      }

      updates.acknowledgedBy = payload.acknowledgedBy;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No supported fields to update.' }, { status: 400 });
    }

    const document = await updateVehicleDocument(id, updates, {
      actor: auth.actor as string,
      historyDetails: {
        fields: Object.keys(updates),
      },
    });

    if (!document) {
      return Response.json({ error: 'Vehicle document not found.' }, { status: 404 });
    }

    return Response.json({ document });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-documents.update',
      route: '/api/vehicle-documents/[id]',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const auth = requireAuth(request);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const document = await deleteVehicleDocument(id, {
      actor: auth.actor as string,
    });

    if (!document) {
      return Response.json({ error: 'Vehicle document not found.' }, { status: 404 });
    }

    return Response.json({ document });
  } catch (error) {
    captureHandledError(error, {
      operation: 'vehicle-documents.delete',
      route: '/api/vehicle-documents/[id]',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
