import type { VehicleDocument } from '@/types';

type VehicleDocumentUpdatePayload = {
  issuedDate?: string | null;
  expiryDate?: string | null;
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

export const createVehicleDocumentRecords = async (documents: VehicleDocument[]) => {
  const response = await fetch('/api/vehicle-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documents }),
  });

  const data = await response.json() as { documents?: VehicleDocument[]; error?: string };

  if (!response.ok || !data.documents) {
    throw new Error(data.error || 'Unable to create vehicle documents.');
  }

  return data.documents;
};

export const deleteVehicleDocumentRecord = async (id: string) => {
  const response = await fetch(`/api/vehicle-documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  const data = await response.json() as { document?: VehicleDocument; error?: string };

  if (!response.ok || !data.document) {
    throw new Error(data.error || 'Unable to delete vehicle document.');
  }

  return data.document;
};
