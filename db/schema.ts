import { boolean, date, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const vehicleDocTypeEnum = pgEnum('vehicle_doc_type', [
  'act',
  'tax',
  'insurance',
  'inspection',
  'registration_book',
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

export type VehicleDocumentRow = typeof vehicleDocuments.$inferSelect;
export type NewVehicleDocumentRow = typeof vehicleDocuments.$inferInsert;
