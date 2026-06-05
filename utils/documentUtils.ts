import type { DocStatus, VehicleDocument, VehicleDocType } from '@/types';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// แปลง enum ประเภทเอกสารให้เป็นข้อความภาษาไทยที่ใช้แสดงบน UI
export const getDocTypeName = (type: VehicleDocType) => {
  const types: Record<VehicleDocType, string> = {
    act: 'พ.ร.บ.',
    tax: 'ภาษี',
    insurance: 'ประกันภัย',
    inspection: 'ตรอ.',
    registration_book: 'เล่มทะเบียน',
  };

  return types[type];
};

// แสดงวันที่แบบไทย และคืนค่าเดิมถ้าข้อมูลวันที่อ่านไม่ได้ เพื่อไม่ซ่อนข้อมูลดิบจาก Excel
export const formatThaiDate = (dateString?: string) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
};

// นับจำนวนวันจากวันนี้ถึงวันหมดอายุ โดยตัดเวลาออกเพื่อให้ผลไม่แกว่งตามชั่วโมงปัจจุบัน
export const getDaysUntilExpiry = (expiryDate?: string) => {
  if (!expiryDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((new Date(expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// รวมกฎสถานะเอกสารไว้จุดเดียว เพื่อให้ table, dashboard และ modal ใช้เกณฑ์เดียวกัน
export const getDocumentStatus = (expiryDate?: string): { status: DocStatus; days: number } => {
  if (!expiryDate) return { status: 'NO_EXPIRY', days: 0 };

  const days = getDaysUntilExpiry(expiryDate);

  if (days < 0) return { status: 'EXPIRED', days };
  if (days <= 30) return { status: 'WARNING', days };
  return { status: 'ACTIVE', days };
};

// key เดือนแบบสั้นสำหรับ grouping ข้อมูลในกราฟ 6 เดือน
export const getSixMonthExpiryKey = (date: Date) => `${THAI_MONTHS[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;

// ใช้ระบุตัวตนของเอกสารแต่ละแถว ให้ action ต่าง ๆ ไม่พลาดไปกระทบเอกสารประเภทเดียวกันของรถคันเดียวกัน
export const getDocumentRecordKey = (document: VehicleDocument) => document.id || [
  document.chassis,
  document.docType,
  document.docNumber || '',
  document.issuedDate || '',
  document.expiryDate || '',
].join('|');

export const isSameDocumentRecord = (a: VehicleDocument, b: VehicleDocument) => getDocumentRecordKey(a) === getDocumentRecordKey(b);
