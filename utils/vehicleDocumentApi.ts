import type { VehicleDocument } from '@/types';

type VehicleDocumentUpdatePayload = {
  isAcknowledged?: boolean;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
};

export const updateVehicleDocumentRecord = async (id: string, updates: VehicleDocumentUpdatePayload) => {
  const response = await fetch(`/api/vehicle-documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json() as { document?: VehicleDocument; error?: string };

  if (!response.ok || !data.document) {
    throw new Error(data.error || 'Unable to update vehicle document.');
  }

  return data.document;
};
