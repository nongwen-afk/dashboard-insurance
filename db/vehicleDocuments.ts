import { asc } from 'drizzle-orm';
import { getDb } from '@/db';
import { vehicleDocuments, type VehicleDocumentRow } from '@/db/schema';
import type { VehicleDocument } from '@/types';

const optionalString = (value: string | null) => value ?? undefined;
const optionalDate = (value: string | null) => value ?? undefined;
const optionalDateTime = (value: Date | string | null) => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
};

export const toVehicleDocument = (row: VehicleDocumentRow): VehicleDocument => ({
  id: row.id,
  chassis: row.chassis,
  licensePlate: optionalString(row.licensePlate),
  project: optionalString(row.project),
  docType: row.docType,
  issuer: optionalString(row.issuer),
  docNumber: optionalString(row.docNumber),
  issuedDate: optionalDate(row.issuedDate),
  expiryDate: optionalDate(row.expiryDate),
  note: optionalString(row.note),
  driverName: optionalString(row.driverName),
  hasAttachment: row.hasAttachment,
  isAcknowledged: row.isAcknowledged,
  acknowledgedAt: optionalDateTime(row.acknowledgedAt),
  acknowledgedBy: optionalString(row.acknowledgedBy),
});

export const listVehicleDocuments = async () => {
  const rows = await getDb()
    .select()
    .from(vehicleDocuments)
    .orderBy(asc(vehicleDocuments.id));

  return rows.map(toVehicleDocument);
};
