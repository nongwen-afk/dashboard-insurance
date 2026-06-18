import { listVehicleDocumentRenewalHistory } from '@/db/vehicleDocuments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const renewals = await listVehicleDocumentRenewalHistory();

    return Response.json({ renewals });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
