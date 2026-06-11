"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Files, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import AlertsModal from '@/components/dashboard/AlertsModal';
import ExpiryChart from '@/components/dashboard/ExpiryChart';
import ExpiryMonthModal from '@/components/dashboard/ExpiryMonthModal';
import StatCard from '@/components/dashboard/StatCard';
import UrgentAlerts from '@/components/dashboard/UrgentAlerts';
import PolicyTable from '../components/PolicyTable';
import type { DocumentAlert, ExpiryMonthGroup, FilterStatus, VehicleDocument } from '@/types';
import { formatThaiDate, getDaysUntilExpiry, getDocTypeName, getRenewedDocumentDates, getSixMonthExpiryKey, isSameDocumentRecord, parseDocumentDate } from '@/utils/documentUtils';
import { initialDocs } from '@/utils/mockData';

export default function DashboardPage() {
  // documents เป็น state หลักของทั้งหน้า: card, chart, alert และ table อ่านจากชุดเดียวกัน
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedExpiryMonth, setSelectedExpiryMonth] = useState<ExpiryMonthGroup | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<VehicleDocument | null>(null);

  // สถานะตัวกรองจาก stat card ที่ส่งไปควบคุม PolicyTable
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const tableRef = useRef<HTMLDivElement>(null);

  const handleStatCardClick = (status: FilterStatus) => {
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

  // สรุปจำนวนเอกสารตามสถานะ เพื่อให้ 5 cards ด้านบนสะท้อนข้อมูลหลัง import Excel ทันที
  const stats = useMemo(() => {
    let active = 0, warning = 0, expired = 0, processing = 0;

    documents.forEach(doc => {
      if (doc.isAcknowledged) {
        processing++;
        return;
      }
      if (!doc.expiryDate) { active++; return; }
      const diffDays = getDaysUntilExpiry(doc.expiryDate);
      if (diffDays < 0) expired++;
      else if (diffDays <= 30) warning++;
      else active++;
    });
    return { total: documents.length, active, warning, expired, processing };
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
      const expDate = parseDocumentDate(doc.expiryDate);
      if (!expDate) return;
      const key = getSixMonthExpiryKey(expDate);
      if (dataMap[key] !== undefined) {
        dataMap[key].push(doc);
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      value: dataMap[key].length,
      docs: dataMap[key].sort((a, b) => (parseDocumentDate(a.expiryDate)?.getTime() || 0) - (parseDocumentDate(b.expiryDate)?.getTime() || 0))
    }));
  }, [documents]);

  // สร้างรายการแจ้งเตือนจากเอกสารที่หมดอายุแล้วหรือใกล้หมดอายุใน 30 วัน
  const alertsList = useMemo<DocumentAlert[]>(() => {
    return documents
      .filter(doc => {
        if (doc.isAcknowledged) return false; // ซ่อนจากการแจ้งเตือนหากกดรับทราบแล้ว
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
          text: `${doc.licensePlate ? 'รถทะเบียน' : 'เลขตัวถัง'} ${doc.licensePlate || doc.chassis} - ${docName} ${isExpired ? 'หมดอายุ' : 'ใกล้หมดอายุ'}`,
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

  const handleSingleSync = (doc: VehicleDocument) => {
    const syncToastId = `sync-doc-${doc.id || doc.chassis}-${doc.docType}`;
    toast.loading(`กำลังตรวจสอบข้อมูลการต่ออายุของ ${doc.licensePlate || doc.chassis || 'ไม่ระบุ'} กับระบบภายนอก...`, { id: syncToastId });

    setTimeout(() => {
      const isRenewed = Math.random() > 0.5;

      if (isRenewed) {
        setDocuments(prev => prev.map(d => {
          if (isSameDocumentRecord(d, doc)) {
            const renewedDates = getRenewedDocumentDates(d.expiryDate);

            return {
              ...d,
              isAcknowledged: false,
              acknowledgedAt: undefined,
              acknowledgedBy: undefined,
              issuedDate: renewedDates.issuedDate,
              expiryDate: renewedDates.expiryDate
            };
          }
          return d;
        }));

        toast.success(`ซิงค์สำเร็จ! พบการต่ออายุใหม่ของรถ ${doc.licensePlate || doc.chassis || 'ไม่ระบุ'} เรียบร้อย`, {
          id: syncToastId,
          icon: '✅',
          duration: 4000
        });
      } else {
        toast.error(`ซิงค์สำเร็จ: ยังไม่พบการชำระเงิน/ต่ออายุใหม่ในระบบของหน่วยงานภายนอก`, {
          id: syncToastId,
          icon: 'ℹ️',
          duration: 4000
        });
      }
    }, 1500);
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard
          title="เอกสารทั้งหมด"
          value={stats.total}
          caption="รายการในระบบ"
          icon={<Files size={28} />}
          iconClassName="bg-slate-50 text-slate-600 border border-slate-100"
          onClick={() => handleStatCardClick('ALL')}
          isActive={statusFilter === 'ALL'}
          activeType="ALL"
        />
        <StatCard
          title="ใช้งานได้"
          value={stats.active}
          caption="ยังไม่ถึงกำหนด"
          icon={<CheckCircle2 size={28} />}
          iconClassName="bg-green-50 text-green-500"
          onClick={() => handleStatCardClick('ACTIVE')}
          isActive={statusFilter === 'ACTIVE'}
          activeType="ACTIVE"
        />
        <StatCard
          title="ใกล้หมดอายุ"
          value={stats.warning}
          caption="ภายใน 30 วัน"
          icon={<AlertCircle size={28} />}
          iconClassName="bg-orange-50 text-orange-500"
          onClick={() => handleStatCardClick('WARNING')}
          isActive={statusFilter === 'WARNING'}
          activeType="WARNING"
        />
        <StatCard
          title="หมดอายุแล้ว"
          value={stats.expired}
          caption="ต้องดำเนินการ"
          icon={<XCircle size={28} />}
          iconClassName="bg-red-50 text-red-500"
          onClick={() => handleStatCardClick('EXPIRED')}
          isActive={statusFilter === 'EXPIRED'}
          activeType="EXPIRED"
        />
        <StatCard
          title="กำลังดำเนินการ"
          value={stats.processing}
          caption="รับทราบเรื่องแล้ว"
          icon={<Clock size={28} />}
          iconClassName="bg-blue-50 text-blue-600"
          onClick={() => handleStatCardClick('PROCESSING')}
          isActive={statusFilter === 'PROCESSING'}
          activeType="PROCESSING"
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
        document={
          selectedDocForDetail
            ? documents.find(d => isSameDocumentRecord(d, selectedDocForDetail)) || selectedDocForDetail
            : null
        }
        onClose={() => setSelectedDocForDetail(null)}
        onAcknowledge={(doc) => {
          setDocuments(prev => prev.map(d => isSameDocumentRecord(d, doc) ? {
            ...d,
            isAcknowledged: true,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'testuser'
          } : d));
          toast.success(`รับทราบการแจ้งเตือนรถ ${doc.licensePlate || doc.chassis} เรียบร้อย`, { icon: 'ℹ️' });
        }}
        onSync={handleSingleSync}
      />

    </div>
  );
}
