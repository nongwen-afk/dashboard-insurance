import * as XLSX from 'xlsx';
import type { VehicleDocType, VehicleDocument } from '@/types';

type SpreadsheetCell = string | number | Date | undefined;

// เก็บ index ของคอลัมน์ที่ parser ใช้ดึงข้อมูลจากแถว Excel
interface ImportColumns {
  chassis: number;
  licensePlate: number;
  project: number;
  docType: number;
  issuer: number;
  docNumber: number;
  issuedDate: number;
  expiryDate: number;
  driverName: number;
  note: number;
}

// ใช้เมื่อไฟล์ไม่มี header ที่ตรวจจับได้ โดยถือว่าคอลัมน์เรียงตาม template มาตรฐานของระบบ
const fallbackColumns: ImportColumns = {
  chassis: 0,
  licensePlate: 1,
  project: 2,
  docType: 3,
  issuer: 4,
  docNumber: 5,
  issuedDate: 6,
  expiryDate: 7,
  driverName: 8,
  note: 9,
};

// รองรับปี พ.ศ. จากไฟล์ Excel แล้ว normalize เป็น ISO date ที่ component อื่นใช้ต่อได้ง่าย
const toIsoDate = (year: number, month: number, day: number) => {
  const normalizedYear = year > 2400 ? year - 543 : year;
  const date = new Date(normalizedYear, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

// Excel เก็บวันที่บางไฟล์เป็น serial number จึงต้องแปลงผ่าน XLSX ก่อนใช้กับ JavaScript Date
const parseExcelSerialDate = (serial: number) => {
  const parsed = XLSX.SSF.parse_date_code(serial);
  return parsed ? toIsoDate(parsed.y, parsed.m, parsed.d) : undefined;
};

// รับวันที่ได้หลายรูปแบบจาก Excel เช่น Date object, serial number, yyyy-mm-dd และ dd/mm/yyyy
const normalizeDateValue = (value?: SpreadsheetCell) => {
  if (value === undefined || value === null || value === '') return undefined;

  if (value instanceof Date) {
    return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === 'number') {
    return parseExcelSerialDate(value);
  }

  const raw = String(value).trim();
  if (!raw) return undefined;

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return toIsoDate(year, month, day);
  }

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 80000) {
      return parseExcelSerialDate(serial);
    }
  }

  const slashMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]);
    return first > 12 ? toIsoDate(year, second, first) : toIsoDate(year, first, second);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return raw;
};

// แปลงชื่อประเภทเอกสารจาก Excel ให้เข้ากับ enum กลางของระบบ
const normalizeDocType = (value?: SpreadsheetCell): VehicleDocType => {
  const raw = String(value || 'act').trim().toLowerCase();
  const compact = raw.replace(/\s|\./g, '');

  if (['act', 'พรบ', 'พ.ร.บ'].includes(compact)) return 'act';
  if (['tax', 'ภาษี', 'ภาษีรถ'].includes(compact)) return 'tax';
  if (['insurance', 'ประกัน', 'ประกันภัย'].includes(compact)) return 'insurance';
  if (['inspection', 'ตรอ', 'ตรวจสภาพ'].includes(compact)) return 'inspection';
  if (['registration_book', 'registrationbook', 'เล่มทะเบียน', 'ทะเบียน'].includes(compact)) return 'registration_book';

  return 'act';
};

// ลดความต่างของหัวคอลัมน์ เช่น เว้นวรรค จุด ขีด หรือภาษาอังกฤษ/ไทย เพื่อให้ detect ได้ยืดหยุ่น
const normalizeHeader = (value?: SpreadsheetCell) => String(value || '')
  .toLowerCase()
  .replace(/[\s*_()./-]/g, '');

// ตรวจหัวตารางเพื่อรองรับไฟล์ที่สลับลำดับคอลัมน์ และ fallback เป็น template ถ้าไม่มี header
const detectImportColumns = (headerRow?: SpreadsheetCell[]) => {
  const headers = (headerRow || []).map(normalizeHeader);
  const findColumn = (candidates: string[]) => {
    const normalizedCandidates = candidates.map((candidate) => normalizeHeader(candidate));
    return headers.findIndex((header) => normalizedCandidates.some((candidate) => header.includes(candidate)));
  };

  const detected: ImportColumns = {
    chassis: findColumn(['เลขตัวถัง', 'chassis']),
    licensePlate: findColumn(['ทะเบียนรถ', 'licenseplate', 'license']),
    project: findColumn(['โครงการ', 'project']),
    docType: findColumn(['ประเภทเอกสาร', 'doctype', 'documenttype']),
    issuer: findColumn(['บริษัทประกัน', 'ผู้ออก', 'issuer']),
    docNumber: findColumn(['เลขที่กรมธรรม์', 'หมายเลขเอกสาร', 'docnumber', 'policy']),
    issuedDate: findColumn(['วันที่มีผล', 'วันเริ่ม', 'issueddate', 'startdate']),
    expiryDate: findColumn(['วันหมดอายุ', 'expirydate', 'expiredate', 'enddate']),
    driverName: findColumn(['ผู้รับผิดชอบ', 'driver', 'คนขับ']),
    note: findColumn(['หมายเหตุ', 'note']),
  };

  const hasRecognizedHeaders = Object.values(detected).some((index) => index >= 0);
  return {
    columns: hasRecognizedHeaders ? detected : fallbackColumns,
    startRowIndex: hasRecognizedHeaders ? 1 : 0,
  };
};

const getCellValue = (row: SpreadsheetCell[], index: number) => index >= 0 ? row[index] : undefined;

// field ที่ไม่บังคับใช้ undefined แทน string ว่าง เพื่อให้ UI แยก "ไม่มีข้อมูล" ได้ชัดขึ้น
const toOptionalString = (value?: SpreadsheetCell) => {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
};

// จุดเข้าใช้งานหลักของ import: อ่านไฟล์ แปลงเป็นแถว ตรวจคอลัมน์ แล้วคืน VehicleDocument[] ที่พร้อม set state
export const parseVehicleDocumentsFromFile = async (file: File): Promise<VehicleDocument[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const worksheetName = workbook.SheetNames[0];
  if (!worksheetName) return [];

  const worksheet = workbook.Sheets[worksheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as SpreadsheetCell[][];
  const { columns, startRowIndex } = detectImportColumns(rows[0]);
  const importedDocs: VehicleDocument[] = [];
  const importBatchId = `${file.name}-${Date.now()}`;

  // ข้ามแถวว่างและแถวที่ไม่มีเลขตัวถัง เพราะเลขตัวถังคือ key ขั้นต่ำของเอกสารรถในระบบนี้
  for (let i = startRowIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const chassis = getCellValue(row, columns.chassis);
    if (!chassis) continue;

    importedDocs.push({
      id: `import-${importBatchId}-${i}`,
      chassis: String(chassis || `CHAS-${Date.now()}-${i}`),
      licensePlate: String(getCellValue(row, columns.licensePlate) || ''),
      project: String(getCellValue(row, columns.project) || ''),
      docType: normalizeDocType(getCellValue(row, columns.docType)),
      issuer: String(getCellValue(row, columns.issuer) || ''),
      docNumber: String(getCellValue(row, columns.docNumber) || ''),
      issuedDate: normalizeDateValue(getCellValue(row, columns.issuedDate)),
      expiryDate: normalizeDateValue(getCellValue(row, columns.expiryDate)),
      driverName: toOptionalString(getCellValue(row, columns.driverName)),
      note: toOptionalString(getCellValue(row, columns.note)),
      hasAttachment: i % 3 !== 0,
    });
  }

  return importedDocs;
};
