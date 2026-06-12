import { config } from 'dotenv';
import { getDb } from '../db';
import { vehicleDocuments } from '../db/schema';
import { initialDocs } from '../utils/mockData';

config({ path: '.env.local' });
config();

const rows = initialDocs.map((document) => ({
  id: document.id || `${document.chassis}-${document.docType}`,
  chassis: document.chassis,
  licensePlate: document.licensePlate || null,
  project: document.project || null,
  docType: document.docType,
  issuer: document.issuer || null,
  docNumber: document.docNumber || null,
  issuedDate: document.issuedDate || null,
  expiryDate: document.expiryDate || null,
  note: document.note || null,
  driverName: document.driverName || null,
  hasAttachment: Boolean(document.hasAttachment),
  isAcknowledged: Boolean(document.isAcknowledged),
  acknowledgedAt: document.acknowledgedAt ? new Date(document.acknowledgedAt) : null,
  acknowledgedBy: document.acknowledgedBy || null,
}));

async function main() {
  await getDb().insert(vehicleDocuments).values(rows).onConflictDoNothing();

  console.log(`Seeded ${rows.length} vehicle document rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
