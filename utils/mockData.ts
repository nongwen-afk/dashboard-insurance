import type { VehicleDocument, VehicleDocType } from '@/types';

type MockDocument = Pick<
  VehicleDocument,
  | 'docType'
  | 'issuer'
  | 'docNumber'
  | 'issuedDate'
  | 'expiryDate'
  | 'note'
  | 'hasAttachment'
  | 'isAcknowledged'
  | 'acknowledgedAt'
  | 'acknowledgedBy'
>;

type MockVehicle = Pick<
  VehicleDocument,
  'chassis' | 'licensePlate' | 'project' | 'driverName'
> & {
  id: string;
  documents: MockDocument[];
};

const issuersByType: Record<VehicleDocType, string> = {
  act: 'บริษัท กรุงเทพประกันภัย จำกัด (มหาชน)',
  tax: 'กรมการขนส่งทางบก',
  insurance: 'บริษัท วิริยะประกันภัย จำกัด (มหาชน)',
  inspection: 'สถานตรวจสภาพรถเอกชน (ตรอ.)',
  registration_book: 'สำนักงานขนส่งกรุงเทพมหานคร',
};

const mockVehicles: MockVehicle[] = [
  {
    id: 'evt-001',
    chassis: 'JTFSX23P606123401',
    licensePlate: '1นข 4827 กรุงเทพมหานคร',
    project: 'รถรับส่งพนักงาน MEA',
    driverName: 'สมชาย วัฒนกิจ',
    documents: [
      { docType: 'act', docNumber: 'พ.ร.บ. 2568/004827', issuedDate: '2025-06-10', expiryDate: '2026-06-10', hasAttachment: true, note: 'รอตรวจสอบหลักฐานการต่ออายุรอบใหม่' },
      { docType: 'tax', docNumber: 'DLT-TAX-4827-69', issuedDate: '2025-06-25', expiryDate: '2026-06-25', hasAttachment: true, note: 'เตรียมชำระภาษีประจำปีภายในเดือนมิถุนายน' },
      { docType: 'insurance', docNumber: 'VIB-MEA-260014', issuedDate: '2026-01-01', expiryDate: '2026-12-31', hasAttachment: false },
    ],
  },
  {
    id: 'evt-002',
    chassis: 'MMKST7HK0NH019274',
    licensePlate: 'ฮธ 9174 กรุงเทพมหานคร',
    project: 'รถเช่า AOT สนามบินสุวรรณภูมิ',
    driverName: 'ธนกฤต พูนทรัพย์',
    documents: [
      { docType: 'act', docNumber: 'พ.ร.บ. 2569/009174', issuedDate: '2025-07-05', expiryDate: '2026-07-05', hasAttachment: true },
      { docType: 'tax', docNumber: 'DLT-TAX-9174-70', issuedDate: '2026-01-15', expiryDate: '2027-01-15', hasAttachment: false },
      { docType: 'inspection', docNumber: 'ตรอ.-AOT-019274', issuedDate: '2025-05-30', expiryDate: '2026-05-30', hasAttachment: false, note: 'ต้องนำรถเข้าตรวจสภาพก่อนดำเนินการต่อภาษี' },
    ],
  },
  {
    id: 'evt-003',
    chassis: 'MP1TFR86JNT005812',
    licensePlate: '72-4581 นครปฐม',
    project: 'ขนส่งอะไหล่ ศูนย์กระจายสินค้าบางบัวทอง',
    driverName: 'วิชัย แสงทอง',
    documents: [
      { docType: 'tax', docNumber: 'DLT-TAX-4581-69', issuedDate: '2025-06-20', expiryDate: '2026-06-20', hasAttachment: true },
      { docType: 'act', docNumber: 'พ.ร.บ. 2569/724581', issuedDate: '2025-09-20', expiryDate: '2026-09-20', hasAttachment: false },
      { docType: 'registration_book', docNumber: 'REG-NPT-005812', issuedDate: '2019-03-12', hasAttachment: false, note: 'จัดเก็บเล่มจริงที่สำนักงานใหญ่' },
    ],
  },
  {
    id: 'evt-004',
    chassis: 'MMAJJKL10MH028643',
    licensePlate: '3ฒข 6412 กรุงเทพมหานคร',
    project: 'รถเช่าผู้บริหาร สำนักงานใหญ่',
    driverName: 'ปรีชา มั่นคง',
    documents: [
      { docType: 'act', docNumber: 'พ.ร.บ. 2568/036412', issuedDate: '2025-05-18', expiryDate: '2026-05-18', hasAttachment: true, isAcknowledged: true, acknowledgedAt: '2026-06-17T03:20:00.000Z', acknowledgedBy: 'testuser', note: 'ฝ่ายธุรการรับทราบและอยู่ระหว่างประสานบริษัทประกัน' },
      { docType: 'tax', docNumber: 'DLT-TAX-6412-69', issuedDate: '2025-11-02', expiryDate: '2026-11-02', hasAttachment: true },
      { docType: 'insurance', docNumber: 'VIB-EXEC-260041', issuedDate: '2026-02-01', expiryDate: '2027-01-31', hasAttachment: false },
    ],
  },
  {
    id: 'evt-005',
    chassis: 'KMHWH81KBLU112905',
    licensePlate: 'ฮย 3358 กรุงเทพมหานคร',
    project: 'Shuttle Bus จุฬาลงกรณ์มหาวิทยาลัย',
    driverName: 'นพดล สุขสวัสดิ์',
    documents: [
      { docType: 'act', docNumber: 'พ.ร.บ. 2569/003358', issuedDate: '2026-03-01', expiryDate: '2027-02-28', hasAttachment: true },
      { docType: 'tax', docNumber: 'DLT-TAX-3358-68', issuedDate: '2025-06-02', expiryDate: '2026-06-02', hasAttachment: false, note: 'ยังไม่พบภาพป้ายภาษีรอบล่าสุดในระบบ' },
      { docType: 'inspection', docNumber: 'ตรอ.-CU-112905', issuedDate: '2025-07-10', expiryDate: '2026-07-10', hasAttachment: false },
    ],
  },
  {
    id: 'evt-006',
    chassis: 'LSJE24096NS086731',
    licensePlate: '4ขย 8821 กรุงเทพมหานคร',
    project: 'รถตรวจงานโครงการรถไฟฟ้าสายสีเหลือง',
    driverName: 'กิตติพงษ์ ศรีเจริญ',
    documents: [
      { docType: 'tax', docNumber: 'DLT-TAX-8821-69', issuedDate: '2026-02-14', expiryDate: '2027-02-14', hasAttachment: true },
      { docType: 'insurance', docNumber: 'VIB-YL-260078', issuedDate: '2025-07-01', expiryDate: '2026-07-01', hasAttachment: false },
      { docType: 'registration_book', docNumber: 'REG-BKK-086731', issuedDate: '2022-02-10', hasAttachment: false, note: 'รถยนต์ไฟฟ้า จัดเก็บสำเนาเล่มทะเบียนที่ฝ่ายยานพาหนะ' },
    ],
  },
  {
    id: 'evt-007',
    chassis: 'JTEGD21A720089451',
    licensePlate: '9กฬ 2026 กรุงเทพมหานคร',
    project: 'รถรับรองลูกค้า VIP',
    driverName: 'สุเมธ ชัยวัฒน์',
    documents: [
      { docType: 'act', docNumber: 'พ.ร.บ. 2569/092026', issuedDate: '2026-04-12', expiryDate: '2027-04-12', hasAttachment: false },
      { docType: 'tax', docNumber: 'DLT-TAX-2026-70', issuedDate: '2026-04-20', expiryDate: '2027-04-20', hasAttachment: true },
      { docType: 'insurance', docNumber: 'VIB-VIP-260026', issuedDate: '2026-04-12', expiryDate: '2027-04-12', hasAttachment: false },
    ],
  },
  {
    id: 'evt-008',
    chassis: 'JN1UBHW41Z0017362',
    licensePlate: 'นข 7755 ชลบุรี',
    project: 'รถรับส่งพนักงานนิคมอมตะซิตี้',
    driverName: 'อำนาจ บุญช่วย',
    documents: [
      { docType: 'act', docNumber: 'พ.ร.บ. 2568/007755', issuedDate: '2025-05-25', expiryDate: '2026-05-25', hasAttachment: false, note: 'ยังไม่มีเอกสารฉบับใหม่จากผู้ประสานงานพื้นที่' },
      { docType: 'tax', docNumber: 'DLT-TAX-7755-69', issuedDate: '2025-06-30', expiryDate: '2026-06-30', hasAttachment: true },
      { docType: 'inspection', docNumber: 'ตรอ.-AMATA-017362', issuedDate: '2026-03-15', expiryDate: '2027-03-15', hasAttachment: false },
    ],
  },
];

export const initialDocs: VehicleDocument[] = mockVehicles.flatMap((vehicle) =>
  vehicle.documents.map((document) => ({
    id: `${vehicle.id}-${document.docType}`,
    chassis: vehicle.chassis,
    licensePlate: vehicle.licensePlate,
    project: vehicle.project,
    driverName: vehicle.driverName,
    issuer: document.issuer || issuersByType[document.docType],
    ...document,
  })),
);
