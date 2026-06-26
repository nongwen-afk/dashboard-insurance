import { randomUUID } from 'node:crypto';
import { asc, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  vehicleDocumentHistory,
  vehicleDocuments,
  type NewVehicleDocumentHistoryRow,
  type NewVehicleDocumentRow,
  type VehicleDocumentHistoryRow,
  type VehicleDocumentRow,
} from '@/db/schema';
import type { VehicleDocType, VehicleDocument, VehicleDocumentHistoryEvent, VehicleDocumentHistoryRecord } from '@/types';

type VehicleDocumentUpdate = {
  issuedDate?: string | null;
  expiryDate?: string | null;
  isAcknowledged?: boolean;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: string | null;
};

type VehicleDocumentWriteOptions = {
  actor?: string;
  historyDetails?: Record<string, unknown>;
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

const getVehicleDocumentRow = async (id: string) => {
  const [row] = await getDb()
    .select()
    .from(vehicleDocuments)
    .where(eq(vehicleDocuments.id, id));

  return row ?? null;
};

const toHistoryRow = (
  document: VehicleDocumentRow,
  eventType: VehicleDocumentHistoryEvent,
  options: VehicleDocumentWriteOptions = {},
  beforeDocument?: VehicleDocumentRow | null,
  afterDocument?: VehicleDocumentRow | null,
): NewVehicleDocumentHistoryRow => ({
  id: randomUUID(),
  documentId: document.id,
  chassis: document.chassis,
  licensePlate: document.licensePlate,
  project: document.project,
  docType: document.docType,
  eventType,
  actor: options.actor || 'system',
  previousIssuedDate: beforeDocument?.issuedDate ?? null,
  nextIssuedDate: afterDocument?.issuedDate ?? document.issuedDate ?? null,
  previousExpiryDate: beforeDocument?.expiryDate ?? null,
  nextExpiryDate: afterDocument?.expiryDate ?? document.expiryDate ?? null,
  details: options.historyDetails || null,
});

const safeRecordVehicleDocumentHistory = async (
  document: VehicleDocumentRow,
  eventType: VehicleDocumentHistoryEvent,
  options: VehicleDocumentWriteOptions = {},
  beforeDocument?: VehicleDocumentRow | null,
  afterDocument?: VehicleDocumentRow | null,
) => {
  try {
    await getDb().insert(vehicleDocumentHistory).values(
      toHistoryRow(document, eventType, options, beforeDocument, afterDocument),
    );
    return true;
  } catch (error) {
    console.error('Unable to record vehicle document history.', error);
    return false;
  }
};

const getHistoryEventForUpdate = (
  beforeDocument: VehicleDocumentRow,
  afterDocument: VehicleDocumentRow,
  updates: VehicleDocumentUpdate,
): VehicleDocumentHistoryEvent => {
  if ('expiryDate' in updates && beforeDocument.expiryDate !== afterDocument.expiryDate) {
    return 'renewed';
  }

  if (updates.isAcknowledged === true && !beforeDocument.isAcknowledged) {
    return 'acknowledged';
  }

  return 'updated';
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

export const toVehicleDocumentHistoryRecord = (row: VehicleDocumentHistoryRow): VehicleDocumentHistoryRecord => ({
  id: row.id,
  documentId: optionalString(row.documentId),
  chassis: row.chassis,
  licensePlate: optionalString(row.licensePlate),
  project: optionalString(row.project),
  docType: row.docType,
  eventType: row.eventType,
  actor: row.actor,
  previousIssuedDate: optionalDate(row.previousIssuedDate),
  nextIssuedDate: optionalDate(row.nextIssuedDate),
  previousExpiryDate: optionalDate(row.previousExpiryDate),
  nextExpiryDate: optionalDate(row.nextExpiryDate),
  details: typeof row.details === 'object' && row.details !== null ? row.details as Record<string, unknown> : undefined,
  eventAt: optionalDateTime(row.eventAt) || new Date().toISOString(),
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

export const listVehicleDocumentHistory = async (documentId: string) => {
  const rows = await getDb()
    .select()
    .from(vehicleDocumentHistory)
    .where(eq(vehicleDocumentHistory.documentId, documentId))
    .orderBy(desc(vehicleDocumentHistory.eventAt));

  return rows.map(toVehicleDocumentHistoryRecord);
};

export const listVehicleDocumentRenewalHistory = async () => {
  const rows = await getDb()
    .select()
    .from(vehicleDocumentHistory)
    .where(eq(vehicleDocumentHistory.eventType, 'renewed'))
    .orderBy(desc(vehicleDocumentHistory.eventAt));

  return rows.map(toVehicleDocumentHistoryRecord);
};

export const listAllVehicleDocumentHistory = async (eventType?: VehicleDocumentHistoryEvent) => {
  const db = getDb();
  let query = db.select().from(vehicleDocumentHistory).$dynamic();
  
  if (eventType) {
    query = query.where(eq(vehicleDocumentHistory.eventType, eventType));
  }
  
  query = query.orderBy(desc(vehicleDocumentHistory.eventAt));

  const rows = await query;
  return rows.map(toVehicleDocumentHistoryRecord);
};

export const createVehicleDocuments = async (documents: VehicleDocument[], options: VehicleDocumentWriteOptions = {}) => {
  if (documents.length === 0) return [];

  const rows = documents.map(toNewVehicleDocumentRow);

  return await getDb().transaction(async (tx) => {
    const insertedRows = await tx
      .insert(vehicleDocuments)
      .values(rows)
      .returning();

    if (insertedRows.length > 0) {
      await Promise.all(
        insertedRows.map((row) =>
          tx.insert(vehicleDocumentHistory).values(
            toHistoryRow(row, 'created', {
              actor: options.actor,
              historyDetails: {
                source: 'document_import',
                ...(options.historyDetails || {}),
              },
            }, null, row)
          )
        )
      );
    }

    return insertedRows.map(toVehicleDocument);
  });
};

export const updateVehicleDocument = async (
  id: string,
  updates: VehicleDocumentUpdate,
  options: VehicleDocumentWriteOptions = {},
) => {
  return await getDb().transaction(async (tx) => {
    const [beforeDocument] = await tx
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.id, id));

    if (!beforeDocument) return null;

    const [updatedRow] = await tx
      .update(vehicleDocuments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(vehicleDocuments.id, id))
      .returning();

    if (!updatedRow) return null;

    await tx.insert(vehicleDocumentHistory).values(
      toHistoryRow(
        updatedRow,
        getHistoryEventForUpdate(beforeDocument, updatedRow, updates),
        {
          actor: options.actor,
          historyDetails: options.historyDetails,
        },
        beforeDocument,
        updatedRow,
      )
    );

    return toVehicleDocument(updatedRow);
  });
};

export const deleteVehicleDocument = async (id: string, options: VehicleDocumentWriteOptions = {}) => {
  return await getDb().transaction(async (tx) => {
    const [beforeDocument] = await tx
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.id, id));

    if (!beforeDocument) return null;

    const [deletedRow] = await tx
      .delete(vehicleDocuments)
      .where(eq(vehicleDocuments.id, id))
      .returning();

    if (!deletedRow) return null;

    await tx.insert(vehicleDocumentHistory).values(
      toHistoryRow(deletedRow, 'deleted', options, beforeDocument, null)
    );

    return toVehicleDocument(deletedRow);
  });
};

export const recordVehicleDocumentHistoryForId = async (
  id: string,
  eventType: VehicleDocumentHistoryEvent,
  options: VehicleDocumentWriteOptions = {},
) => {
  const document = await getVehicleDocumentRow(id);
  if (!document) return null;

  const isRecorded = await safeRecordVehicleDocumentHistory(document, eventType, options, document, document);

  return { document: toVehicleDocument(document), isRecorded };
};
