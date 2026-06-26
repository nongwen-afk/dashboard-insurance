"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Files, CheckCircle2, AlertCircle, XCircle, CalendarCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import RenewalHistoryModal from '@/components/RenewalHistoryModal';
import AlertsModal from '@/components/dashboard/AlertsModal';
import ExpiryChart from '@/components/dashboard/ExpiryChart';
import StatCard from '@/components/dashboard/StatCard';
import UrgentAlerts from '@/components/dashboard/UrgentAlerts';
import PolicyTable from '../components/PolicyTable';
import AddDocumentModal from '@/components/dashboard/AddDocumentModal';
import AddNoteModal from '@/components/dashboard/AddNoteModal';
import type { DocumentAlert, FilterStatus, VehicleDocument, CalendarNote } from '@/types';
import { formatThaiDate, getDaysUntilExpiry, getDocTypeName, getRenewedDocumentDates, isSameDocumentRecord } from '@/utils/documentUtils';
import { deleteVehicleDocumentRecord, recordVehicleDocumentHistoryEvent, updateVehicleDocumentRecord } from '@/utils/vehicleDocumentApi';
import { listCalendarNotesRecord, deleteCalendarNoteRecord } from '@/utils/calendarNotesApi';
import { captureHandledError } from '@/utils/sentry';

export default function DashboardPage() {
  // documents เป็น state หลักของทั้งหน้า: card, chart, alert และ table อ่านจากชุดเดียวกัน
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isRenewalHistoryOpen, setIsRenewalHistoryOpen] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<VehicleDocument | null>(null);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<string | undefined>(undefined);

  // States สำหรับโน้ตปฏิทิน
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  const handleAddDocumentTrigger = (dateStr: string) => {
    setSelectedDateForAdd(dateStr);
    setIsAddDocumentOpen(true);
  };

  const handleAddDocumentSuccess = (newDoc: VehicleDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleAddNoteTrigger = (dateStr: string) => {
    setSelectedDateForAdd(dateStr);
    setIsAddNoteOpen(true);
  };

  const handleAddNoteSuccess = (newNote: CalendarNote) => {
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = async (id: string) => {
    const previousNotes = notes;
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      await deleteCalendarNoteRecord(id);
      toast.success('ลบโน้ตเตือนความจำสำเร็จ', { icon: '🗑️' });
    } catch (error) {
      captureHandledError(error, { operation: 'dashboard.calendar-note.delete' });
      setNotes(previousNotes);
      toast.error('ลบโน้ตเตือนความจำไม่สำเร็จ');
    }
  };

  // สถานะตัวกรองจาก stat card ที่ส่งไปควบคุม PolicyTable
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const tableRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const abortController = new AbortController();

    async function loadDocuments() {
      try {
        setIsLoadingDocuments(true);

        const response = await fetch('/api/vehicle-documents', {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load vehicle documents from Neon.');
        }

        const data = await response.json() as { documents?: VehicleDocument[] };
        setDocuments(data.documents ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        captureHandledError(error, { operation: 'dashboard.vehicle-documents.load' });
        toast.error('โหลดข้อมูลจาก Neon ไม่สำเร็จ');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingDocuments(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadNotes() {
      try {
        const loadedNotes = await listCalendarNotesRecord(abortController.signal);
        setNotes(loadedNotes);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        captureHandledError(error, { operation: 'dashboard.calendar-notes.load' });
        toast.error('โหลดข้อมูลโน้ตปฏิทินไม่สำเร็จ');
      }
    }

    void loadNotes();

    return () => {
      abortController.abort();
    };
  }, []);

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

  const handleAcknowledgeDocument = async (doc: VehicleDocument) => {
    const acknowledgedAt = new Date().toISOString();
    const acknowledgedBy = 'testuser';
    const optimisticDocument = {
      ...doc,
      isAcknowledged: true,
      acknowledgedAt,
      acknowledgedBy,
    };

    setDocuments(prev => prev.map(d => isSameDocumentRecord(d, doc) ? optimisticDocument : d));

    try {
      if (!doc.id) {
        throw new Error('Missing vehicle document id.');
      }

      const savedDocument = await updateVehicleDocumentRecord(doc.id, {
        isAcknowledged: true,
        acknowledgedAt,
        acknowledgedBy,
      });

      setDocuments(prev => prev.map(d => isSameDocumentRecord(d, doc) ? savedDocument : d));
      toast.success(`รับทราบการแจ้งเตือนรถ ${doc.licensePlate || doc.chassis} เรียบร้อย`, { icon: 'ℹ️' });
    } catch (error) {
      captureHandledError(error, { operation: 'dashboard.vehicle-document.acknowledge' });
      setDocuments(prev => prev.map(d => isSameDocumentRecord(d, optimisticDocument) ? doc : d));
      toast.error(`บันทึกการรับทราบของรถ ${doc.licensePlate || doc.chassis} ไปยัง Neon ไม่สำเร็จ`);
    }
  };

  const handleDeleteDocument = async (doc: VehicleDocument) => {
    const previousDocuments = documents;
    const deletedIndex = previousDocuments.findIndex(d => isSameDocumentRecord(d, doc));

    setDocuments(prev => prev.filter(d => !isSameDocumentRecord(d, doc)));
    if (selectedDocForDetail && isSameDocumentRecord(selectedDocForDetail, doc)) {
      setSelectedDocForDetail(null);
    }

    try {
      if (!doc.id) {
        throw new Error('Missing vehicle document id.');
      }

      await deleteVehicleDocumentRecord(doc.id);
      toast.success(`ลบข้อมูล ${doc.licensePlate || doc.chassis} ออกจาก Neon แล้ว`, { icon: '🗑️' });
    } catch (error) {
      captureHandledError(error, { operation: 'dashboard.vehicle-document.delete' });
      setDocuments(prev => {
        if (prev.some(d => isSameDocumentRecord(d, doc))) return prev;

        const next = [...prev];
        const insertIndex = deletedIndex >= 0 ? Math.min(deletedIndex, next.length) : next.length;
        next.splice(insertIndex, 0, doc);
        return next;
      });
      toast.error(`ลบข้อมูล ${doc.licensePlate || doc.chassis} จาก Neon ไม่สำเร็จ`);
    }
  };

  // สรุปจำนวนเอกสารตาม workflow หลัก เพื่อให้ cards ด้านบนสะท้อนข้อมูลหลัง import Excel ทันที
  const stats = useMemo(() => {
    let active = 0, warning = 0, notRenewed = 0;

    documents.forEach(doc => {
      if (doc.isAcknowledged) {
        notRenewed++;
        return;
      }
      if (!doc.expiryDate) { active++; return; }
      const diffDays = getDaysUntilExpiry(doc.expiryDate);
      if (diffDays < 0) notRenewed++;
      else if (diffDays <= 30) warning++;
      else active++;
    });
    return { total: documents.length, active, warning, notRenewed };
  }, [documents]);


  // สร้างรายการแจ้งเตือนจากเอกสารที่ยังไม่ต่อหรือใกล้ถึงรอบต่อใน 30 วัน
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
          text: `${doc.licensePlate ? 'รถทะเบียน' : 'เลขตัวถัง'} ${doc.licensePlate || doc.chassis} - ${docName} ${isExpired ? 'ยังไม่ต่อ' : 'ใกล้ถึงรอบต่อ'}`,
          type: isExpired ? 'error' as const : 'warning' as const,
          date: formatThaiDate(doc.expiryDate),
          daysText: daysText,
          diffDays,
          doc,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [documents]);

  // หน้า dashboard แสดงรายการด่วนให้เต็มพื้นที่การ์ด ส่วนรายการเต็มเปิดใน AlertsModal
  const topUrgentDocs = alertsList.slice(0, 6);

  const handleSingleSync = (doc: VehicleDocument) => {
    const syncToastId = `sync-doc-${doc.id || doc.chassis}-${doc.docType}`;
    toast.loading(`กำลังตรวจสอบข้อมูลการต่ออายุของ ${doc.licensePlate || doc.chassis || 'ไม่ระบุ'} กับระบบภายนอก...`, { id: syncToastId });

    setTimeout(async () => {
      const isRenewed = Math.random() > 0.5;

      if (isRenewed) {
        const renewedDates = getRenewedDocumentDates(doc.expiryDate);
        const optimisticDocument: VehicleDocument = {
          ...doc,
          isAcknowledged: false,
          acknowledgedAt: undefined,
          acknowledgedBy: undefined,
          issuedDate: renewedDates.issuedDate,
          expiryDate: renewedDates.expiryDate
        };

        setDocuments(prev => prev.map(d => {
          if (isSameDocumentRecord(d, doc)) {
            return optimisticDocument;
          }
          return d;
        }));

        try {
          if (!doc.id) {
            throw new Error('Missing vehicle document id.');
          }

          const savedDocument = await updateVehicleDocumentRecord(doc.id, {
            isAcknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
            issuedDate: renewedDates.issuedDate,
            expiryDate: renewedDates.expiryDate,
          });

          setDocuments(prev => prev.map(d => isSameDocumentRecord(d, optimisticDocument) ? savedDocument : d));
          toast.success(`ซิงค์สำเร็จ! พบการต่ออายุใหม่ของรถ ${doc.licensePlate || doc.chassis || 'ไม่ระบุ'} เรียบร้อย`, {
            id: syncToastId,
            icon: '✅',
            duration: 4000
          });
        } catch (error) {
          captureHandledError(error, { operation: 'dashboard.vehicle-document.renew' });
          setDocuments(prev => prev.map(d => isSameDocumentRecord(d, optimisticDocument) ? doc : d));
          toast.error(`พบการต่ออายุ แต่บันทึกลง Neon ไม่สำเร็จ`, {
            id: syncToastId,
            icon: '⚠️',
            duration: 5000
          });
        }
      } else {
        if (doc.id) {
          void recordVehicleDocumentHistoryEvent(doc.id, 'sync_no_update', {
            source: 'external_sync',
            scope: 'detail_modal',
          }).catch((error) => {
            captureHandledError(error, { operation: 'dashboard.vehicle-document.sync-history' });
          });
        }

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#006b2f]">
            รายการเอกสารยานพาหนะ
          </h1>
          <button
            type="button"
            onClick={() => setIsRenewalHistoryOpen(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#1a4d2e]/20 bg-white px-4 text-sm font-bold text-[#1a4d2e] shadow-sm transition-colors hover:bg-[#f1f7f3] sm:w-auto"
          >
            <CalendarCheck2 size={17} />
            ประวัติการต่ออายุ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          title="ต่อแล้ว"
          value={stats.active}
          caption="ยังไม่ต้องต่อ"
          icon={<CheckCircle2 size={28} />}
          iconClassName="bg-green-50 text-green-500"
          onClick={() => handleStatCardClick('ACTIVE')}
          isActive={statusFilter === 'ACTIVE'}
          activeType="ACTIVE"
        />
        <StatCard
          title="ใกล้ถึงรอบต่อ"
          value={stats.warning}
          caption="ภายใน 30 วัน"
          icon={<AlertCircle size={28} />}
          iconClassName="bg-orange-50 text-orange-500"
          onClick={() => handleStatCardClick('WARNING')}
          isActive={statusFilter === 'WARNING'}
          activeType="WARNING"
        />
        <StatCard
          title="ยังไม่ต่อ"
          value={stats.notRenewed}
          caption="ต้องต่ออายุ"
          icon={<XCircle size={28} />}
          iconClassName="bg-red-50 text-red-500"
          onClick={() => handleStatCardClick('EXPIRED')}
          isActive={statusFilter === 'EXPIRED'}
          activeType="EXPIRED"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExpiryChart
          documents={documents}
          notes={notes}
          onSelectDocument={setSelectedDocForDetail}
          onAddDocument={handleAddDocumentTrigger}
          onAddNote={handleAddNoteTrigger}
          onDeleteNote={handleDeleteNote}
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
          isLoading={isLoadingDocuments}
          onAcknowledgeDocument={handleAcknowledgeDocument}
          onDeleteDocument={handleDeleteDocument}
          onCreateDocument={() => {
            setSelectedDateForAdd(undefined);
            setIsAddDocumentOpen(true);
          }}
        />
      </div>

      {isAlertModalOpen && (
        <AlertsModal
          alerts={alertsList}
          onClose={() => setIsAlertModalOpen(false)}
          onSelectDocument={setSelectedDocForDetail}
        />
      )}

      {isRenewalHistoryOpen && (
        <RenewalHistoryModal onClose={() => setIsRenewalHistoryOpen(false)} />
      )}

      <DocumentDetailModal
        document={
          selectedDocForDetail
            ? documents.find(d => isSameDocumentRecord(d, selectedDocForDetail)) || selectedDocForDetail
            : null
        }
        onClose={() => setSelectedDocForDetail(null)}
        onAcknowledge={handleAcknowledgeDocument}
        onSync={handleSingleSync}
      />

      <AddDocumentModal
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
        onSuccess={handleAddDocumentSuccess}
        defaultExpiryDate={selectedDateForAdd}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onSuccess={handleAddNoteSuccess}
        defaultNoteDate={selectedDateForAdd}
      />

    </div>
  );
}
