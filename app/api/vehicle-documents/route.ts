import { listVehicleDocuments } from '@/db/vehicleDocuments';

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
