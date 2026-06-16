// ประเภทเอกสารที่ระบบรองรับ ใช้ร่วมกันทั้ง dashboard, table และ import Excel
export type VehicleDocType = 'act' | 'tax' | 'insurance' | 'inspection' | 'registration_book';

// โครงสร้างข้อมูลหลักของเอกสารรถ 1 รายการ หลังจาก mock data หรือ Excel ถูก normalize แล้ว
export interface VehicleDocument {
  id?: string;
  chassis: string;
  licensePlate?: string;
  project?: string;
  docType: VehicleDocType;
  issuer?: string;
  docNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  note?: string;
  driverName?: string;
  hasAttachment?: boolean;
  isAcknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// สถานะเอกสารคำนวณจากวันหมดอายุ เพื่อใช้จัดสี ป้ายเตือน และลำดับความสำคัญ
export type DocStatus = 'EXPIRED' | 'WARNING' | 'ACTIVE' | 'NO_EXPIRY';
export type FilterStatus = 'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED';
export type SortOption = 'RELEVANCE' | 'DATE_ASC' | 'DATE_DESC';
export type AlertSeverity = 'error' | 'warning';

// รูปแบบข้อมูลแจ้งเตือนที่แปลงจาก VehicleDocument เพื่อให้ component แสดงผลได้ตรงกัน
export interface DocumentAlert {
  id: string;
  text: string;
  type: AlertSeverity;
  date: string;
  daysText: string;
  diffDays: number;
  doc: VehicleDocument;
}

// กลุ่มเอกสารตามเดือน ใช้กับปฏิทินต่ออายุและรายการตามวัน
export interface ExpiryMonthGroup {
  name: string;
  docs: VehicleDocument[];
}
