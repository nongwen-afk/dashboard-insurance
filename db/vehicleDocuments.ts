import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { vehicleDocuments, type NewVehicleDocumentRow, type VehicleDocumentRow } from '@/db/schema';
import type { VehicleDocType, VehicleDocument } from '@/types';

type VehicleDocumentUpdate = {
  issuedDate?: string | null;
  expiryDate?: string | null;
  isAcknowledged?: boolean;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: string | null;
};

const supportedDocTypes = new Set<VehicleDocType>([
  'act',
  'tax',
  'insurance',
  'inspection',
  'registration_book',
]);

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

const nullableString = (value?: string) => {
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const nullableDate = (value?: string) => {
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const nullableDateTime = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid acknowledgedAt value.');
  }

  return date;
};

export const toNewVehicleDocumentRow = (document: VehicleDocument): NewVehicleDocumentRow => {
  if (!document.id) {
    throw new Error('Vehicle document id is required.');
  }

  if (!document.chassis) {
    throw new Error('Vehicle document chassis is required.');
  }

  if (!supportedDocTypes.has(document.docType)) {
    throw new Error('Unsupported vehicle document type.');
  }

  return {
    id: document.id,
    chassis: document.chassis,
    licensePlate: nullableString(document.licensePlate),
    project: nullableString(document.project),
    docType: document.docType,
    issuer: nullableString(document.issuer),
    docNumber: nullableString(document.docNumber),
    issuedDate: nullableDate(document.issuedDate),
    expiryDate: nullableDate(document.expiryDate),
    note: nullableString(document.note),
    driverName: nullableString(document.driverName),
    hasAttachment: Boolean(document.hasAttachment),
    isAcknowledged: Boolean(document.isAcknowledged),
    acknowledgedAt: nullableDateTime(document.acknowledgedAt),
    acknowledgedBy: nullableString(document.acknowledgedBy),
  };
};

export const listVehicleDocuments = async () => {
  const rows = await getDb()
    .select()
    .from(vehicleDocuments)
    .orderBy(asc(vehicleDocuments.id));

  return rows.map(toVehicleDocument);
};

export const createVehicleDocuments = async (documents: VehicleDocument[]) => {
  if (documents.length === 0) return [];

  const rows = documents.map(toNewVehicleDocumentRow);
  const insertedRows = await getDb()
    .insert(vehicleDocuments)
    .values(rows)
    .returning();

  return insertedRows.map(toVehicleDocument);
};

export const updateVehicleDocument = async (id: string, updates: VehicleDocumentUpdate) => {
  const [updatedRow] = await getDb()
    .update(vehicleDocuments)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(vehicleDocuments.id, id))
    .returning();

  return updatedRow ? toVehicleDocument(updatedRow) : null;
};

export const deleteVehicleDocument = async (id: string) => {
  const [deletedRow] = await getDb()
    .delete(vehicleDocuments)
    .where(eq(vehicleDocuments.id, id))
    .returning();

  return deletedRow ? toVehicleDocument(deletedRow) : null;
};
