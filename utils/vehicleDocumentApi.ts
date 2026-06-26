import type { VehicleDocument, VehicleDocumentHistoryEvent, VehicleDocumentHistoryRecord } from '@/types';

type VehicleDocumentUpdatePayload = {
  issuedDate?: string | null;
  expiryDate?: string | null;
  isAcknowledged?: boolean;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  actor?: string;
};

const getAuthHeaders = (contentType?: string) => {
  const token = process.env.NEXT_PUBLIC_API_SECRET_KEY || 'default-secret-token-for-dev';
  return {
    'Authorization': `Bearer ${token}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
};
export const updateVehicleDocumentRecord = async (id: string, updates: VehicleDocumentUpdatePayload) => {
  const response = await fetch(`/api/vehicle-documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify(updates),
  });

  const data = await response.json() as { document?: VehicleDocument; error?: string };

  if (!response.ok || !data.document) {
    throw new Error(data.error || 'Unable to update vehicle document.');
  }

  return data.document;
};

type CreateVehicleDocumentOptions = {
  actor?: string;
  source?: string;
};

export const createVehicleDocumentRecords = async (
  documents: VehicleDocument[],
  options?: CreateVehicleDocumentOptions,
) => {
  const response = await fetch('/api/vehicle-documents', {
    method: 'POST',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({
      documents,
      actor: options?.actor || 'testuser',
      source: options?.source || 'document_import',
    }),
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
    headers: getAuthHeaders(),
  });

  const data = await response.json() as { document?: VehicleDocument; error?: string };

  if (!response.ok || !data.document) {
    throw new Error(data.error || 'Unable to delete vehicle document.');
  }

  return data.document;
};

export const recordVehicleDocumentHistoryEvent = async (
  id: string,
  eventType: VehicleDocumentHistoryEvent,
  details?: Record<string, unknown>,
) => {
  const response = await fetch(`/api/vehicle-documents/${encodeURIComponent(id)}/history`, {
    method: 'POST',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({
      eventType,
      actor: 'testuser',
      details,
    }),
  });

  const data = await response.json() as { logged?: boolean; error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Unable to record vehicle document history.');
  }

  return Boolean(data.logged);
};

export const listVehicleDocumentHistoryRecords = async (id: string) => {
  const response = await fetch(`/api/vehicle-documents/${encodeURIComponent(id)}/history`);
  const data = await response.json() as { history?: VehicleDocumentHistoryRecord[]; error?: string };

  if (!response.ok || !data.history) {
    throw new Error(data.error || 'Unable to load vehicle document history.');
  }

  return data.history;
};

export const listVehicleDocumentRenewalHistoryRecords = async (signal?: AbortSignal) => {
  const response = await fetch('/api/vehicle-document-renewals', { signal });
  const data = await response.json() as { renewals?: VehicleDocumentHistoryRecord[]; error?: string };

  if (!response.ok || !data.renewals) {
    throw new Error(data.error || 'Unable to load vehicle document renewal history.');
  }

  return data.renewals;
};

export const listAllVehicleDocumentHistoryRecords = async (
  eventType?: string,
  signal?: AbortSignal,
) => {
  const url = eventType
    ? `/api/vehicle-document-history?eventType=${eventType}`
    : '/api/vehicle-document-history';
  const response = await fetch(url, { signal });
  const data = await response.json() as { history?: VehicleDocumentHistoryRecord[]; error?: string };
  if (!response.ok || !data.history) {
    throw new Error(data.error || 'Unable to load history.');
  }
  return data.history;
};
