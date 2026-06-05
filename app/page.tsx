"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Files, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import AlertsModal from '@/components/dashboard/AlertsModal';
import ExpiryChart from '@/components/dashboard/ExpiryChart';
import ExpiryMonthModal from '@/components/dashboard/ExpiryMonthModal';
import StatCard from '@/components/dashboard/StatCard';
import UrgentAlerts from '@/components/dashboard/UrgentAlerts';
import PolicyTable from '../components/PolicyTable';
import type { DocumentAlert, ExpiryMonthGroup, VehicleDocType, VehicleDocument } from '@/types';
import { formatThaiDate, getDaysUntilExpiry, getDocTypeName, getSixMonthExpiryKey } from '@/utils/documentUtils';

// ข้อมูลตั้งต้นใช้จำลองเอกสารในระบบก่อนผู้ใช้จะนำเข้า Excel เพิ่ม
const initialDocsSeed: VehicleDocument[] = [
  { chassis: 'CHAS-001', licensePlate: '1กข 1111', docType: 'act', issuedDate: '2025-06-15', expiryDate: '2026-06-15', driverName: 'สมชาย ใจดี', project: 'สายเหนือ' },
  { chassis: 'CHAS-002', licensePlate: '2กค 2222', docType: 'tax', issuedDate: '2025-06-20', expiryDate: '2026-06-20', driverName: 'สมศรี รักงาน', project: 'ผู้บริหาร' },
  { chassis: 'CHAS-003', licensePlate: '3กง 3333', docType: 'insurance', issuedDate: '2025-06-25', expiryDate: '2026-06-25', driverName: 'วิชัย เก่งกล้า' },
  { chassis: 'CHAS-004', licensePlate: '4กข 4444', docType: 'act', issuedDate: '2025-07-05', expiryDate: '2026-07-05', driverName: 'มานพ' },
  { chassis: 'CHAS-005', licensePlate: '5กค 5555', docType: 'tax', issuedDate: '2025-07-12', expiryDate: '2026-07-12', driverName: 'สุดา' },
  { chassis: 'CHAS-006', licensePlate: '6กง 6666', docType: 'insurance', issuedDate: '2025-07-28', expiryDate: '2026-07-28', driverName: 'ปรีชา' },
  { chassis: 'CHAS-007', licensePlate: '7กข 7777', docType: 'act', issuedDate: '2025-08-10', expiryDate: '2026-08-10', driverName: 'นิภา' },
  { chassis: 'CHAS-008', licensePlate: '8กค 8888', docType: 'tax', issuedDate: '2025-08-15', expiryDate: '2026-08-15', driverName: 'สมปอง' },
  { chassis: 'CHAS-009', licensePlate: '9กง 9999', docType: 'act', issuedDate: '2025-08-20', expiryDate: '2026-08-20', driverName: 'วิรัช' },
  { chassis: 'CHAS-010', licensePlate: '1กข 1010', docType: 'insurance', issuedDate: '2025-08-25', expiryDate: '2026-08-25', driverName: 'อารีย์' },
  { chassis: 'CHAS-011', licensePlate: '2กค 2020', docType: 'tax', issuedDate: '2025-09-05', expiryDate: '2026-09-05', driverName: 'สุรศักดิ์' },
  { chassis: 'CHAS-012', licensePlate: '3กง 3030', docType: 'act', issuedDate: '2025-09-18', expiryDate: '2026-09-18', driverName: 'นารี' },
  { chassis: 'CHAS-013', licensePlate: '4กข 4040', docType: 'insurance', issuedDate: '2025-10-10', expiryDate: '2026-10-10', driverName: 'กมล' },
  { chassis: 'CHAS-014', licensePlate: '5กค 5050', docType: 'tax', issuedDate: '2025-10-22', expiryDate: '2026-10-22', driverName: 'ประยุทธ์' },
  { chassis: 'CHAS-015', licensePlate: '6กง 6060', docType: 'act', issuedDate: '2025-11-05', expiryDate: '2026-11-05', driverName: 'มณี' },
  { chassis: 'CHAS-016', licensePlate: '7กข 7070', docType: 'registration_book', issuedDate: '2019-01-10' }, 
  { chassis: 'CHAS-017', licensePlate: '8กค 8080', docType: 'registration_book', issuedDate: '2020-03-15' }, 
  { chassis: 'CHAS-018', licensePlate: '9กง 9090', docType: 'act', issuedDate: '2025-05-10', expiryDate: '2026-05-10', driverName: 'สมเกียรติ' }, 
  { chassis: 'CHAS-019', licensePlate: '1กข 1212', docType: 'tax', issuedDate: '2025-05-20', expiryDate: '2026-05-20', driverName: 'วรรณา' }, 
  { chassis: 'CHAS-020', licensePlate: '2กค 2323', docType: 'insurance', issuedDate: '2025-06-05', expiryDate: '2026-06-05', driverName: 'ธนากร' }, 
];

// issuer default ช่วยเติมข้อมูลเชิงเอกสารให้ mock data โดยอิงจากประเภทเอกสาร
const issuersByType: Record<VehicleDocType, string> = {
  act: 'กรมการขนส่งทางบก',
  tax: 'กรมการขนส่งทางบก',
  insurance: 'EVT Insurance Broker',
  inspection: 'ศูนย์ตรวจสภาพรถ EVT',
  registration_book: 'สำนักงานขนส่งจังหวัด',
};

// เติม field ที่ dashboard/detail modal ต้องใช้ เพื่อให้ mock data มีรูปทรงใกล้ข้อมูลจริงจาก Excel
const initialDocs: VehicleDocument[] = initialDocsSeed.map((doc, index) => ({
  issuer: issuersByType[doc.docType],
  docNumber: `${doc.docType.toUpperCase()}-${String(index + 1).padStart(5, '0')}`,
  note: doc.expiryDate
    ? `ตรวจสอบเอกสารรอบถัดไปก่อนวันหมดอายุ 30 วัน`
    : 'เอกสารประเภทนี้ไม่มีวันหมดอายุ แต่ควรตรวจสอบข้อมูลทะเบียนให้ตรงกับรถจริง',
  hasAttachment: index % 3 !== 1,
  project: doc.project || 'ส่วนกลาง',
  ...doc,
}));

export default function DashboardPage() {
  // documents เป็น state หลักของทั้งหน้า: card, chart, alert และ table อ่านจากชุดเดียวกัน
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedExpiryMonth, setSelectedExpiryMonth] = useState<ExpiryMonthGroup | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<VehicleDocument | null>(null);

  // สถานะตัวกรองจาก stat card ที่ส่งไปควบคุม PolicyTable
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED'>('ALL');
  const tableRef = useRef<HTMLDivElement>(null);

  const handleStatCardClick = (status: 'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED') => {
    setStatusFilter(status);
    if (tableRef.current) {
      const headerOffset = 90; // ความสูง Header + ระยะห่างความสวยงาม
      const elementPosition = tableRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // สรุปจำนวนเอกสารตามสถานะ เพื่อให้ 4 cards ด้านบนสะท้อนข้อมูลหลัง import Excel ทันที
  const stats = useMemo(() => {
    let active = 0, warning = 0, expired = 0;

    documents.forEach(doc => {
      if (!doc.expiryDate) { active++; return; }
      const diffDays = getDaysUntilExpiry(doc.expiryDate);
      if (diffDays < 0) expired++;
      else if (diffDays <= 30) warning++;
      else active++;
    });
    return { total: documents.length, active, warning, expired };
  }, [documents]);

  // จัดกลุ่มเอกสารที่จะหมดอายุใน 6 เดือนข้างหน้า เพื่อแสดงบนกราฟและใช้เปิด modal รายเดือน
  const chartData = useMemo(() => {
    const dataMap: Record<string, VehicleDocument[]> = {};
    
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      dataMap[getSixMonthExpiryKey(d)] = [];
    }

    documents.forEach(doc => {
      if (!doc.expiryDate) return;
      const expDate = new Date(doc.expiryDate);
      const key = getSixMonthExpiryKey(expDate);
      if (dataMap[key] !== undefined) {
        dataMap[key].push(doc);
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      value: dataMap[key].length,
      docs: dataMap[key].sort((a, b) => new Date(a.expiryDate || 0).getTime() - new Date(b.expiryDate || 0).getTime())
    }));
  }, [documents]);

  // สร้างรายการแจ้งเตือนจากเอกสารที่หมดอายุแล้วหรือใกล้หมดอายุใน 30 วัน
  const alertsList = useMemo<DocumentAlert[]>(() => {
    return documents
      .filter(doc => {
        if (!doc.expiryDate) return false;
        const diffDays = getDaysUntilExpiry(doc.expiryDate);
        return diffDays <= 30; 
      })
      .map((doc, index) => {
        const diffDays = getDaysUntilExpiry(doc.expiryDate);
        const isExpired = diffDays < 0;
        const docName = getDocTypeName(doc.docType);

        // ข้อความวันคงเหลือใช้ร่วมกันทั้งกล่องแจ้งเตือนด่วนและ modal แจ้งเตือนทั้งหมด
        let daysText = '';
        if (diffDays < 0) {
            daysText = `(เลยกำหนด ${Math.abs(diffDays)} วัน)`;
        } else if (diffDays === 0) {
            daysText = `(หมดอายุวันนี้)`;
        } else {
            daysText = `(เหลืออีก ${diffDays} วัน)`;
        }

        return {
          id: `alert-${index}`,
          text: `รถทะเบียน ${doc.licensePlate || doc.chassis} - ${docName} ${isExpired ? 'หมดอายุ' : 'ใกล้หมดอายุ'}`,
          type: isExpired ? 'error' as const : 'warning' as const,
          date: formatThaiDate(doc.expiryDate),
          daysText: daysText,
          diffDays,
          doc,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays); 
  }, [documents]);

  // หน้า dashboard แสดงเฉพาะ 4 รายการที่ด่วนที่สุด ส่วนรายการเต็มเปิดใน AlertsModal
  const topUrgentDocs = alertsList.slice(0, 4);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
          <span>รายการยานพาหนะ</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700">เอกสารยานพาหนะ</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#006b2f]">
          รายการเอกสารยานพาหนะ
        </h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="เอกสารทั้งหมด"
          value={stats.total}
          caption="รายการในระบบ"
          icon={<Files size={28} />}
          iconClassName="bg-blue-50 text-blue-600"
          onClick={() => handleStatCardClick('ALL')}
        />
        <StatCard
          title="ใช้งานได้"
          value={stats.active}
          caption="ยังไม่ถึงกำหนด"
          icon={<CheckCircle2 size={28} />}
          iconClassName="bg-green-50 text-green-500"
          onClick={() => handleStatCardClick('ACTIVE')}
        />
        <StatCard
          title="ใกล้หมดอายุ"
          value={stats.warning}
          caption="ภายใน 30 วัน"
          icon={<AlertCircle size={28} />}
          iconClassName="bg-orange-50 text-orange-500"
          onClick={() => handleStatCardClick('WARNING')}
        />
        <StatCard
          title="หมดอายุแล้ว"
          value={stats.expired}
          caption="ต้องดำเนินการ"
          icon={<XCircle size={28} />}
          iconClassName="bg-red-50 text-red-500"
          onClick={() => handleStatCardClick('EXPIRED')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExpiryChart
          chartData={chartData}
          onSelectMonth={setSelectedExpiryMonth}
        />
        <UrgentAlerts
          alerts={topUrgentDocs}
          onOpenAll={() => setIsAlertModalOpen(true)}
          onSelectDocument={setSelectedDocForDetail}
        />
      </div>

      <div ref={tableRef}>
        <PolicyTable 
          documents={documents} 
          setDocuments={setDocuments} 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      {isAlertModalOpen && (
        <AlertsModal
          alerts={alertsList}
          onClose={() => setIsAlertModalOpen(false)}
          onSelectDocument={setSelectedDocForDetail}
        />
      )}

      {selectedExpiryMonth && (
        <ExpiryMonthModal
          month={selectedExpiryMonth}
          onClose={() => setSelectedExpiryMonth(null)}
          onSelectDocument={setSelectedDocForDetail}
        />
      )}

      <DocumentDetailModal
        document={selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
      />

    </div>
  );
}
