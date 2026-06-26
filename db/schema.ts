import { boolean, date, jsonb, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const vehicleDocTypeEnum = pgEnum('vehicle_doc_type', [
  'act',
  'tax',
  'insurance',
  'inspection',
  'registration_book',
]);

export const vehicleDocumentHistoryEventEnum = pgEnum('vehicle_document_history_event', [
  'created',
  'acknowledged',
  'renewed',
  'sync_no_update',
  'deleted',
  'updated',
  'downloaded',
]);

export const vehicleDocuments = pgTable('vehicle_documents', {
  id: varchar('id', { length: 128 }).primaryKey(),
  chassis: varchar('chassis', { length: 128 }).notNull(),
  licensePlate: varchar('license_plate', { length: 64 }),
  project: text('project'),
  docType: vehicleDocTypeEnum('doc_type').notNull(),
  issuer: text('issuer'),
  docNumber: varchar('doc_number', { length: 128 }),
  issuedDate: date('issued_date'),
  expiryDate: date('expiry_date'),
  note: text('note'),
  driverName: text('driver_name'),
  hasAttachment: boolean('has_attachment').default(false).notNull(),
  isAcknowledged: boolean('is_acknowledged').default(false).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgedBy: text('acknowledged_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehicleDocumentHistory = pgTable('vehicle_document_history', {
  id: varchar('id', { length: 128 }).primaryKey(),
  documentId: varchar('document_id', { length: 128 }),
  chassis: varchar('chassis', { length: 128 }).notNull(),
  licensePlate: varchar('license_plate', { length: 64 }),
  project: text('project'),
  docType: vehicleDocTypeEnum('doc_type').notNull(),
  eventType: vehicleDocumentHistoryEventEnum('event_type').notNull(),
  actor: text('actor').default('system').notNull(),
  previousIssuedDate: date('previous_issued_date'),
  nextIssuedDate: date('next_issued_date'),
  previousExpiryDate: date('previous_expiry_date'),
  nextExpiryDate: date('next_expiry_date'),
  details: jsonb('details'),
  eventAt: timestamp('event_at', { withTimezone: true }).defaultNow().notNull(),
});


export type VehicleDocumentRow = typeof vehicleDocuments.$inferSelect;
export type NewVehicleDocumentRow = typeof vehicleDocuments.$inferInsert;
export type VehicleDocumentHistoryRow = typeof vehicleDocumentHistory.$inferSelect;
export type NewVehicleDocumentHistoryRow = typeof vehicleDocumentHistory.$inferInsert;

export const calendarNotes = pgTable('calendar_notes', {
  id: varchar('id', { length: 128 }).primaryKey(),
  noteDate: date('note_date').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CalendarNoteRow = typeof calendarNotes.$inferSelect;
export type NewCalendarNoteRow = typeof calendarNotes.$inferInsert;

