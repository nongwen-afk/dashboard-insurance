import type { DocStatus, VehicleDocument, VehicleDocType } from '@/types';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const formatDateOnly = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

export const parseDocumentDate = (dateString?: string) => {
  if (!dateString) return null;

  const dateOnlyMatch = dateString.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, rawYear, rawMonth, rawDay] = dateOnlyMatch;
    const year = Number(rawYear);
    const month = Number(rawMonth);
    const day = Number(rawDay);
    const date = new Date(year, month - 1, day);

    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getRenewedDocumentDates = (expiryDate?: string) => {
  const currentExpiry = parseDocumentDate(expiryDate) || new Date();
  const newExpiry = new Date(currentExpiry.getFullYear() + 1, currentExpiry.getMonth(), currentExpiry.getDate());

  return {
    issuedDate: expiryDate || formatDateOnly(new Date()),
    expiryDate: formatDateOnly(newExpiry),
  };
};

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

  const date = parseDocumentDate(dateString);
  if (!date) return dateString;

  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
};

// นับจำนวนวันจากวันนี้ถึงวันหมดอายุ โดยตัดเวลาออกเพื่อให้ผลไม่แกว่งตามชั่วโมงปัจจุบัน
export const getDaysUntilExpiry = (expiryDate?: string) => {
  if (!expiryDate) return 0;

  const expiry = parseDocumentDate(expiryDate);
  if (!expiry) return Number.NaN;
  expiry.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY);
};

// รวมกฎสถานะเอกสารไว้จุดเดียว เพื่อให้ table, dashboard และ modal ใช้เกณฑ์เดียวกัน
export const getDocumentStatus = (expiryDate?: string): { status: DocStatus; days: number } => {
  if (!expiryDate) return { status: 'NO_EXPIRY', days: 0 };

  const days = getDaysUntilExpiry(expiryDate);
  if (Number.isNaN(days)) return { status: 'ACTIVE', days: 0 };

  if (days < 0) return { status: 'EXPIRED', days };
  if (days <= 30) return { status: 'WARNING', days };
  return { status: 'ACTIVE', days };
};

// key เดือนแบบสั้นสำหรับ grouping ข้อมูลในกราฟ 6 เดือน
export const getSixMonthExpiryKey = (date: Date) => `${THAI_MONTHS[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;

// แสดงวันและเวลาแบบไทย
export const formatThaiDateTime = (dateString?: string) => {
  if (!dateString) return '-';

  const date = parseDocumentDate(dateString);
  if (!date) return dateString;

  const datePart = `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (dateString.includes('T') || dateString.includes(':')) {
    return `${datePart} เวลา ${hours}:${minutes} น.`;
  }

  return datePart;
};

// ใช้ระบุตัวตนของเอกสารแต่ละแถว ให้ action ต่าง ๆ ไม่พลาดไปกระทบเอกสารประเภทเดียวกันของรถคันเดียวกัน
export const getDocumentRecordKey = (document: VehicleDocument) => document.id || [
  document.chassis,
  document.docType,
  document.docNumber || '',
  document.issuedDate || '',
  document.expiryDate || '',
].join('|');

export const isSameDocumentRecord = (a: VehicleDocument, b: VehicleDocument) => getDocumentRecordKey(a) === getDocumentRecordKey(b);

// แยกป้ายทะเบียนรถเฉพาะตัวเลข/ตัวอักษรหลัก (ตัดจังหวัดออก)
export const getCleanLicensePlate = (plate?: string) => {
  if (!plate) return '';
  const parts = plate.trim().split(/\s+/);
  if (parts.length > 1) {
    // ถ้ามีจังหวัดอยู่ด้านหลัง (คั่นด้วยช่องว่าง) ให้ดึงเฉพาะส่วนแรกๆ
    return parts.slice(0, parts.length - 1).join(' ');
  }
  return plate;
};
