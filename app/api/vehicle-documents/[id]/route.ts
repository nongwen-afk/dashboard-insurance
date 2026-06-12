import { deleteVehicleDocument, updateVehicleDocument } from '@/db/vehicleDocuments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VehicleDocumentPatchPayload = {
  isAcknowledged?: unknown;
  acknowledgedAt?: unknown;
  acknowledgedBy?: unknown;
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

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const payload = await request.json() as VehicleDocumentPatchPayload;
    const updates: Parameters<typeof updateVehicleDocument>[1] = {};

    if (typeof payload.isAcknowledged === 'boolean') {
      updates.isAcknowledged = payload.isAcknowledged;
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

    const document = await updateVehicleDocument(id, updates);

    if (!document) {
      return Response.json({ error: 'Vehicle document not found.' }, { status: 404 });
    }

    return Response.json({ document });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const document = await deleteVehicleDocument(id);

    if (!document) {
      return Response.json({ error: 'Vehicle document not found.' }, { status: 404 });
    }

    return Response.json({ document });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
