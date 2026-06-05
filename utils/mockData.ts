import type { VehicleDocument, VehicleDocType } from '@/types';

// พิกัดวันปัจจุบันจำลองอิงตามระบบ: 2026-06-05
// ข้อมูลดิบตั้งต้นที่มีระดับความสมบูรณ์แตกต่างกัน เพื่อทดสอบความคงทนและหน้าตาของระบบ
export const initialDocsSeed: VehicleDocument[] = [
  // 1. กลุ่มหมดอายุแล้ว (Expired) - ไม่มีการตอบรับ
  { chassis: 'CHAS-EXP-001', licensePlate: '1กข 1111', docType: 'act', issuedDate: '2025-05-01', expiryDate: '2026-05-01', driverName: 'สมชาย ใจดี', project: 'สายเดินรถภาคเหนือ' },
  { chassis: 'CHAS-EXP-002', licensePlate: '2กค 2222', docType: 'tax', issuedDate: '2025-05-10', expiryDate: '2026-05-10', driverName: 'สมศรี รักงาน', project: 'รถเช่าผู้บริหาร' },
  { chassis: 'CHAS-EXP-003', licensePlate: '', docType: 'insurance', issuedDate: '2025-05-15', expiryDate: '2026-05-15', driverName: 'วิชัย เก่งกล้า' }, // ไม่มีทะเบียน
  { chassis: 'CHAS-EXP-004', licensePlate: '4กข 4444', docType: 'inspection', issuedDate: '2025-05-20', expiryDate: '2026-05-20', driverName: '' }, // ไม่มีคนขับ
  
  // 2. กลุ่มหมดอายุแล้วแต่ได้รับการกดยอมรับแล้ว (Expired but Acknowledged) -> จะเป็นสถานะ "กำลังดำเนินการ" ทันทีที่โหลดหน้าเว็บ
  { chassis: 'CHAS-ACK-001', licensePlate: '9กง 9090', docType: 'act', issuedDate: '2025-05-10', expiryDate: '2026-05-10', driverName: 'สมเกียรติ ยอดเยี่ยม', isAcknowledged: true },
  { chassis: 'CHAS-ACK-002', licensePlate: '8กข 8080', docType: 'tax', issuedDate: '2025-05-05', expiryDate: '2026-05-05', driverName: '', isAcknowledged: true }, // ไม่มีคนขับแต่อ่านรับทราบแล้ว

  // 3. กลุ่มใกล้หมดอายุ (Warning) - มีระยะคงเหลือไม่เกิน 30 วัน (นับจาก 2026-06-05)
  { chassis: 'CHAS-WAR-001', licensePlate: '2กค 2323', docType: 'insurance', issuedDate: '2025-06-05', expiryDate: '2026-06-06', driverName: 'ธนากร นำทาง' }, // เหลือ 1 วัน
  { chassis: 'CHAS-WAR-002', licensePlate: '3กง 3333', docType: 'act', issuedDate: '2025-06-10', expiryDate: '2026-06-15', driverName: 'วีรยุทธ สุจริต' }, // เหลือ 10 วัน
  { chassis: 'CHAS-WAR-003', licensePlate: '', docType: 'tax', issuedDate: '2025-06-15', expiryDate: '2026-06-20', driverName: 'รุ่งโรจน์ สว่าง' }, // เหลือ 15 วัน, ไม่มีทะเบียน
  { chassis: 'CHAS-WAR-004', licensePlate: '5กค 5050', docType: 'inspection', issuedDate: '2025-06-20', expiryDate: '2026-06-25', driverName: '' }, // เหลือ 20 วัน, ไม่มีคนขับ
  { chassis: 'CHAS-WAR-005', licensePlate: '6กง 6060', docType: 'insurance', issuedDate: '2025-06-25', expiryDate: '2026-07-02', driverName: 'นพพล เรืองดี' }, // เหลือ 27 วัน

  // 4. กลุ่มใกล้หมดอายุแต่ยอมรับแล้ว (Warning Acknowledged)
  { chassis: 'CHAS-ACK-003', licensePlate: '1กข 1212', docType: 'tax', issuedDate: '2025-05-20', expiryDate: '2026-06-10', driverName: 'วรรณา สุขใจ', isAcknowledged: true }, // เหลือ 5 วัน แต่ยอมรับแล้ว

  // 5. กลุ่มปกติ (Active) - เหลืออายุมากกว่า 30 วัน
  // กรกฎาคม (July 2026): 4 รายการ (รวม CHAS-WAR-005 ที่หมดอายุ 2 ก.ค. เป็น 4 รายการ)
  { chassis: 'CHAS-ACT-001', licensePlate: '7กข 7777', docType: 'act', issuedDate: '2025-07-10', expiryDate: '2026-07-10', driverName: 'นิภา รักสิทธิ์', project: 'สายเดินรถภาคใต้' },
  { chassis: 'CHAS-ACT-002', licensePlate: '8กค 8888', docType: 'tax', issuedDate: '2025-07-25', expiryDate: '2026-07-25', driverName: 'สมปอง คำดี', project: 'รถสวัสดิการ โรงงาน A' },
  { chassis: 'CHAS-ACT-003', licensePlate: '9กง 9999', docType: 'insurance', issuedDate: '2025-07-28', expiryDate: '2026-07-28', driverName: '', project: 'รถรับส่งพนักงาน MEA' },

  // สิงหาคม (August 2026): 3 รายการ
  { chassis: 'CHAS-ACT-004', licensePlate: '', docType: 'act', issuedDate: '2025-08-05', expiryDate: '2026-08-05', driverName: 'มนัส ปัญญา' },
  { chassis: 'CHAS-ACT-005', licensePlate: '1กข 2020', docType: 'inspection', issuedDate: '2025-08-15', expiryDate: '2026-08-15', driverName: 'ชัชชาติ แข็งแกร่ง' },
  { chassis: 'CHAS-ACT-006', licensePlate: '2กค 3030', docType: 'insurance', issuedDate: '2025-08-22', expiryDate: '2026-08-22', driverName: 'ธวัชชัย รวดเร็ว' },

  // กันยายน (September 2026): 1 รายการ
  { chassis: 'CHAS-ACT-007', licensePlate: '3กง 4040', docType: 'insurance', issuedDate: '2025-09-12', expiryDate: '2026-09-12', driverName: 'วิภา สุภาพ', project: 'รถเวียน จุฬาฯ' },

  // ตุลาคม (October 2026): 7 รายการ
  { chassis: 'CHAS-ACT-008', licensePlate: '4กข 5050', docType: 'tax', issuedDate: '2025-10-02', expiryDate: '2026-10-02', driverName: 'ณรงค์ รักสงบ', project: 'รถเช่า AOT' },
  { chassis: 'CHAS-ACT-009', licensePlate: '5กค 6060', docType: 'act', issuedDate: '2025-10-05', expiryDate: '2026-10-05', driverName: 'สุดา แสนดี', project: 'Shuttle Bus ไอคอนสยาม' },
  { chassis: 'CHAS-ACT-010', licensePlate: '', docType: 'inspection', issuedDate: '2025-10-10', expiryDate: '2026-10-10', driverName: 'เกษม สุขใจ' },
  { chassis: 'CHAS-ACT-011', licensePlate: '6กง 7070', docType: 'insurance', issuedDate: '2025-10-15', expiryDate: '2026-10-15', driverName: 'มานะ ขยันยิ่ง' },
  { chassis: 'CHAS-ACT-012', licensePlate: '7กข 8080', docType: 'tax', issuedDate: '2025-10-20', expiryDate: '2026-10-20', driverName: 'สมศรี มีทรัพย์' },
  { chassis: 'CHAS-ACT-013', licensePlate: '8กค 9090', docType: 'act', issuedDate: '2025-10-22', expiryDate: '2026-10-22', driverName: 'เจริญ ดีเลิศ', project: 'รถเวียน ม.เกษตร' },
  { chassis: 'CHAS-ACT-014', licensePlate: '9กง 1010', docType: 'insurance', issuedDate: '2025-10-25', expiryDate: '2026-10-25', driverName: 'พงษ์ศักดิ์ ชูใจ', project: 'รถร่วมบริการด่วน (BRT)' },

  // พฤศจิกายน (November 2026): 2 รายการ
  { chassis: 'CHAS-ACT-015', licensePlate: '2กค 4040', docType: 'inspection', issuedDate: '2025-11-05', expiryDate: '2026-11-05', driverName: 'ประเสริฐ ดีใจ' },
  { chassis: 'CHAS-ACT-016', licensePlate: '3กง 5050', docType: 'insurance', issuedDate: '2025-11-18', expiryDate: '2026-11-18', driverName: 'อารีย์ พึ่งตน' },

  // นอกช่วง 6 เดือน (December 2026 / January 2027)
  { chassis: 'CHAS-ACT-017', licensePlate: '1กข 3030', docType: 'tax', issuedDate: '2025-12-29', expiryDate: '2026-12-29', driverName: 'จรรยา งามตา' },
  { chassis: 'CHAS-ACT-018', licensePlate: '4กข 6060', docType: 'act', issuedDate: '2025-12-10', expiryDate: '2026-12-10', driverName: 'อำนาจ มั่นคง' },
  { chassis: 'CHAS-ACT-019', licensePlate: '5กค 7070', docType: 'tax', issuedDate: '2026-01-05', expiryDate: '2027-01-05', driverName: 'ขวัญชัย ศรีสุข' },
  { chassis: 'CHAS-ACT-020', licensePlate: '', docType: 'insurance', issuedDate: '2026-01-20', expiryDate: '2027-01-20', driverName: 'สุรพล ทองดี' },

  // 6. กลุ่มไม่มีวันหมดอายุ (No Expiry) - เช่น เล่มทะเบียน (registration_book)
  { chassis: 'CHAS-NOEXP-001', licensePlate: '7กข 7070', docType: 'registration_book', issuedDate: '2019-01-10', driverName: 'กิตติศักดิ์' },
  { chassis: 'CHAS-NOEXP-002', licensePlate: '8กค 8080', docType: 'registration_book', issuedDate: '2020-03-15', driverName: '' }, // ไม่มีคนขับ
  { chassis: 'CHAS-NOEXP-003', licensePlate: '', docType: 'registration_book', issuedDate: '2021-05-20', driverName: 'วิทยา ใจสว่าง' }, // ไม่มีทะเบียน
  { chassis: 'CHAS-NOEXP-004', licensePlate: '9กง 9091', docType: 'registration_book', issuedDate: '2022-07-25', driverName: 'อนันต์ สุขเกษม', project: '' }, // ไม่มีระบุโครงการ
  { chassis: 'CHAS-NOEXP-005', licensePlate: '3กง 3030', docType: 'registration_book', issuedDate: '2023-09-30', driverName: 'ชลิตา จิระ' }
];

// default issuer ตามแต่ละประเภท
const issuersByType: Record<VehicleDocType, string> = {
  act: 'กรมการขนส่งทางบก',
  tax: 'กรมการขนส่งทางบก',
  insurance: 'EVT Insurance Broker',
  inspection: 'ศูนย์ตรวจสภาพรถเอกชน (ตรอ.)',
  registration_book: 'สำนักงานขนส่งกรุงเทพมหานคร',
};

// เติมฟิลด์ประกอบ เพื่อความสมบูรณ์และสมจริงในการนำไปแสดงผล
export const initialDocs: VehicleDocument[] = initialDocsSeed.map((doc, index) => {
  const isIndexEven = index % 2 === 0;
  return {
    issuer: isIndexEven ? issuersByType[doc.docType] : undefined, // บางเอกสารไม่มีระบุผู้ออกเพื่อทดสอบข้อมูลไม่ครบ
    docNumber: isIndexEven ? `${doc.docType.toUpperCase()}-${String(index + 1).padStart(5, '0')}` : undefined, // บางเอกสารไม่มีหมายเลข
    note: doc.expiryDate
      ? `เอกสารนี้จำเป็นต้องดำเนินการตรวจสอบตามที่กฎหมายกำหนดก่อนวันสิ้นอายุ`
      : undefined, // บางเอกสารไม่มีโน้ตแจ้งเตือน
    hasAttachment: index % 3 !== 1, // สลับให้บางเอกสารไม่มีปุ่มดาวน์โหลด/ดูไฟล์แนบ
    project: doc.project || (index % 3 === 0 ? 'รถร่วมบริการด่วน (BRT)' : 'รถเช่าส่วนกลาง'),
    ...doc,
  };
});
