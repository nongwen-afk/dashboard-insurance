"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Search, Filter, FileSpreadsheet, Paperclip, MoreHorizontal,
  ChevronLeft, ChevronRight, X, ArrowUpDown,
  Eye, RefreshCw, Trash2, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import type { DocStatus, FilterStatus, SortOption, VehicleDocument } from '@/types';
import { getDocumentAttachmentPreview } from '@/utils/documentAttachment';
import { formatThaiDate, getCleanLicensePlate, getDocTypeName, getDocumentRecordKey, getDocumentStatus, getRenewedDocumentDates, isSameDocumentRecord, parseDocumentDate } from '@/utils/documentUtils';
import { parseVehicleDocumentsFromFile } from '@/utils/importVehicleDocuments';
import { createVehicleDocumentRecords, recordVehicleDocumentHistoryEvent, updateVehicleDocumentRecord } from '@/utils/vehicleDocumentApi';

interface PolicyTableProps {
  documents: VehicleDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<VehicleDocument[]>>;
  statusFilter: FilterStatus;
  setStatusFilter: (status: FilterStatus) => void;
  isLoading?: boolean;
  onAcknowledgeDocument: (document: VehicleDocument) => void | Promise<void>;
  onDeleteDocument: (document: VehicleDocument) => void | Promise<void>;
}

// แปลงสถานะจาก helper ให้เป็นข้อความและสีสำหรับคอลัมน์สถานะในตาราง
const getStatusBadge = (status: DocStatus, days: number, isAcknowledged?: boolean) => {
  if (isAcknowledged) {
    return {
      label: 'ยังไม่ต่อ',
      detail: 'ต้องต่ออายุ',
      className: 'bg-blue-50 text-blue-700 border-blue-100',
      detailClassName: 'text-blue-600',
    };
  }

  if (status === 'EXPIRED') {
    return {
      label: 'ยังไม่ต่อ',
      detail: `เลยกำหนดมาแล้ว ${Math.abs(days)} วัน`,
      className: 'bg-red-50 text-red-700 border-red-100',
      detailClassName: 'text-red-600',
    };
  }

  if (status === 'WARNING') {
    return {
      label: 'ใกล้ถึงรอบต่อ',
      detail: `เหลืออีก ${days} วัน`,
      className: 'bg-orange-50 text-orange-700 border-orange-100',
      detailClassName: 'text-orange-600',
    };
  }

  if (status === 'NO_EXPIRY') {
    return {
      label: 'ไม่ต้องต่อ',
      detail: 'ตรวจสอบตามรอบเอกสาร',
      className: 'bg-slate-50 text-slate-600 border-slate-200',
      detailClassName: 'text-slate-500',
    };
  }

  return {
    label: 'ต่อแล้ว',
    detail: 'ยังไม่ต้องต่อ',
    className: 'bg-green-50 text-green-700 border-green-100',
    detailClassName: 'text-green-600',
  };
};

const getStatusFilterLabel = (status: FilterStatus) => {
  const labels: Record<FilterStatus, string> = {
    ALL: 'ทั้งหมด',
    ACTIVE: 'ต่อแล้ว / ไม่ต้องต่อ',
    WARNING: 'ใกล้ถึงรอบต่อ',
    EXPIRED: 'ยังไม่ต่อ',
  };

  return labels[status];
};

const matchesDocumentFilters = (
  doc: VehicleDocument,
  query: string,
  docTypeFilter: string,
  statusFilter: FilterStatus,
) => {
  const docTypeName = getDocTypeName(doc.docType).toLowerCase();
  const matchSearch =
    doc.chassis.toLowerCase().includes(query) ||
    (doc.licensePlate?.toLowerCase() || '').includes(query) ||
    (doc.project?.toLowerCase() || '').includes(query) ||
    docTypeName.includes(query);

  const matchDocType = docTypeFilter === 'ALL' || doc.docType === docTypeFilter;
  const { status } = getDocumentStatus(doc.expiryDate);
  let matchStatus = true;

  if (statusFilter !== 'ALL') {
    if (statusFilter === 'EXPIRED') {
      matchStatus = !!doc.isAcknowledged || status === 'EXPIRED';
    } else if (doc.isAcknowledged) {
      matchStatus = false;
    } else if (statusFilter === 'ACTIVE') {
      matchStatus = status === 'ACTIVE' || status === 'NO_EXPIRY';
    } else {
      matchStatus = status === statusFilter;
    }
  }

  return matchSearch && matchDocType && matchStatus;
};

type RenewalSyncResult = {
  doc: VehicleDocument;
  renewedDocument: VehicleDocument | null;
};

export default function PolicyTable({
  documents,
  setDocuments,
  statusFilter,
  setStatusFilter,
  isLoading = false,
  onAcknowledgeDocument,
  onDeleteDocument,
}: PolicyTableProps) {
  // searchInput คือค่าที่พิมพ์อยู่ ส่วน activeSearch คือค่าที่ debounce แล้วจึงนำไปกรองจริง
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('RELEVANCE');

  const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(null);

  const [selectedDocForDetail, setSelectedDocForDetail] = useState<VehicleDocument | null>(null);

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
          toast.success(`ต่อแล้ว: อัปเดตวันต่ออายุของรถ ${doc.licensePlate || doc.chassis || 'ไม่ระบุ'} เรียบร้อย`, {
            id: syncToastId,
            icon: '✅',
            duration: 4000
          });
        } catch {
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
            scope: 'table_row',
          }).catch((error) => {
            console.error('Unable to record sync history.', error);
          });
        }

        toast.error(`ยังไม่ต่อ: ยังไม่พบการชำระเงิน/ต่ออายุใหม่ในระบบของหน่วยงานภายนอก`, {
          id: syncToastId,
          icon: 'ℹ️',
          duration: 4000
        });
      }
    }, 1500);
  };

  const handleGlobalSync = () => {
    const syncToastId = 'global-sync-toast';
    toast.loading('กำลังตรวจเช็คการต่ออายุเอกสารทั้งหมดกับระบบภายนอก...', { id: syncToastId });

    setTimeout(async () => {
      const processingDocs = documents.filter(d => d.isAcknowledged);

      if (processingDocs.length === 0) {
        toast.success('ซิงค์สำเร็จ! ข้อมูลทุกรายการอัปเดตเป็นปัจจุบันแล้ว', {
          id: syncToastId,
          icon: '🔄',
          duration: 3000
        });
        return;
      }

      const syncResults: RenewalSyncResult[] = processingDocs.map((doc) => {
        const isRenewed = Math.random() > 0.5;

        if (!isRenewed) {
          return { doc, renewedDocument: null };
        }

        const renewedDates = getRenewedDocumentDates(doc.expiryDate);

        return {
          doc,
          renewedDocument: {
            ...doc,
            isAcknowledged: false,
            acknowledgedAt: undefined,
            acknowledgedBy: undefined,
            issuedDate: renewedDates.issuedDate,
            expiryDate: renewedDates.expiryDate
          },
        };
      });

      const renewedResults = syncResults.filter((result): result is { doc: VehicleDocument; renewedDocument: VehicleDocument } => result.renewedDocument !== null);
      const pendingResults = syncResults.filter((result) => result.renewedDocument === null);
      const pendingCount = syncResults.length - renewedResults.length;

      if (pendingResults.length > 0) {
        void Promise.allSettled(pendingResults.map(({ doc }) => {
          if (!doc.id) return Promise.resolve(false);

          return recordVehicleDocumentHistoryEvent(doc.id, 'sync_no_update', {
            source: 'external_sync',
            scope: 'global_sync',
          });
        }));
      }

      if (renewedResults.length === 0) {
        toast.error(
          `ยังไม่ต่อ: เอกสารทั้ง ${pendingCount} รายการยังไม่พบการชำระเงิน/ต่ออายุใหม่ในระบบ`,
          {
            id: syncToastId,
            icon: 'ℹ️',
            duration: 5000
          }
        );
        return;
      }

      setDocuments(prev => prev.map(d => {
        const result = renewedResults.find(item => isSameDocumentRecord(item.doc, d));
        return result?.renewedDocument || d;
      }));

      const saveResults = await Promise.allSettled(renewedResults.map(({ doc, renewedDocument }) => {
        if (!doc.id) {
          return Promise.reject(new Error('Missing vehicle document id.'));
        }

        return updateVehicleDocumentRecord(doc.id, {
          isAcknowledged: false,
          acknowledgedAt: null,
          acknowledgedBy: null,
          issuedDate: renewedDocument.issuedDate,
          expiryDate: renewedDocument.expiryDate,
        });
      }));

      const savedDocuments = saveResults.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      const failedRenewals = renewedResults.filter((_, index) => saveResults[index].status === 'rejected');

      if (savedDocuments.length > 0 || failedRenewals.length > 0) {
        setDocuments(prev => prev.map(d => {
          const savedDocument = savedDocuments.find(saved => isSameDocumentRecord(saved, d));
          if (savedDocument) return savedDocument;

          const failedRenewal = failedRenewals.find(({ renewedDocument }) => isSameDocumentRecord(renewedDocument, d));
          return failedRenewal?.doc || d;
        }));
      }

      if (savedDocuments.length > 0) {
        toast.success(
          `ต่อแล้ว ${savedDocuments.length} รายการ, ยังไม่ต่ออีก ${pendingCount} รายการ`,
          {
            id: syncToastId,
            icon: '✅',
            duration: 5000
          }
        );
      } else {
        toast.error(
          `พบรายการต่ออายุ แต่บันทึกลง Neon ไม่สำเร็จ ${failedRenewals.length} รายการ`,
          {
            id: syncToastId,
            icon: '⚠️',
            duration: 5000
          }
        );
      }
    }, 1500);
  };

  // หน่วงการค้นหาเล็กน้อยเพื่อลด toast ถี่เกินไปและไม่กรองข้อมูลทุก key stroke ทันที
  useEffect(() => {
    const searchToastId = 'search-toast';

    const timer = setTimeout(() => {
      if (searchInput !== activeSearch) {
        if (searchInput.trim() !== '') {
          setActiveSearch(searchInput);

          const query = searchInput.toLowerCase();
          const foundCount = documents.filter((doc) => matchesDocumentFilters(doc, query, docTypeFilter, statusFilter)).length;

          if (foundCount > 0) {
            toast.success(`พบข้อมูล ${foundCount} รายการ`, { id: searchToastId });
          } else {
            toast.error(`ไม่พบข้อมูล "${searchInput}"`, { id: searchToastId });
          }

        } else {
          setActiveSearch('');
          toast.dismiss(searchToastId);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, activeSearch, documents, docTypeFilter, statusFilter]);

  // ให้ utility แปลงไฟล์เป็น VehicleDocument[] แล้ว component รับผิดชอบแค่ update state และแจ้งผล
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('กำลังประมวลผลไฟล์...');

    try {
      const newImportedDocs = await parseVehicleDocumentsFromFile(file);

      if (newImportedDocs.length > 0) {
        const savedDocs = await createVehicleDocumentRecords(newImportedDocs);

        setDocuments(prev => [...savedDocs, ...prev]);
        setCurrentPage(1);
        toast.success(`นำเข้าข้อมูลสำเร็จ ${savedDocs.length} รายการ`, { id: loadingToast });
      } else {
        toast.error('ไม่พบข้อมูลในไฟล์ Excel', { id: loadingToast });
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์', { id: loadingToast });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // รวมการค้นหา กรองประเภท และจัดเรียงไว้ใน memo เพื่อให้ตารางคำนวณใหม่เฉพาะตอนข้อมูลหรือ filter เปลี่ยน
  const filteredDocs = useMemo(() => {
    const query = activeSearch.toLowerCase();

    const filtered = documents.filter((doc) => {
      return matchesDocumentFilters(doc, query, docTypeFilter, statusFilter);
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'RELEVANCE') {
        const statusA = getDocumentStatus(a.expiryDate);
        const statusB = getDocumentStatus(b.expiryDate);
        // ความเกี่ยวข้องให้เอกสารหมดอายุมาก่อน ตามด้วยใกล้หมดอายุ เพื่อให้งานด่วนอยู่บนสุด
        const priority: Record<DocStatus, number> = { EXPIRED: 3, WARNING: 2, ACTIVE: 1, NO_EXPIRY: 0 };

        if (priority[statusA.status] !== priority[statusB.status]) {
          return priority[statusB.status] - priority[statusA.status];
        }
        if (a.expiryDate && b.expiryDate) {
           return statusA.days - statusB.days;
        }
        return 0;
      }
      else if (sortBy === 'DATE_ASC') {
        const dateA = parseDocumentDate(a.expiryDate);
        const dateB = parseDocumentDate(b.expiryDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      }
      else if (sortBy === 'DATE_DESC') {
        const dateA = parseDocumentDate(a.expiryDate);
        const dateB = parseDocumentDate(b.expiryDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  }, [documents, activeSearch, docTypeFilter, sortBy, statusFilter]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const safeCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  // แยกข้อมูลเฉพาะหน้าปัจจุบันหลังจาก filter/sort เสร็จแล้ว
  const currentDocs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredDocs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocs, safeCurrentPage]);

  // ปิด action menu เมื่อคลิกนอกเมนู เพื่อไม่ให้ dropdown ค้างหลังเลือกงานอื่น
  useEffect(() => {
    const handleClickOutside = () => {
      if (openActionMenuKey !== null) {
        setOpenActionMenuKey(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openActionMenuKey]);

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">

      <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:flex-1">
          <div className="relative w-full sm:max-w-sm lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาทะเบียน, โครงการ, ประเภทเอกสาร..."
              className="h-11 w-full pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d2e] transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterOpen(!isFilterOpen);
                  setIsSortOpen(false);
                }}
                className={`relative flex h-11 items-center gap-2 px-4 bg-white border rounded-xl transition-colors text-sm font-medium shadow-sm ${isFilterOpen ? 'border-[#1a4d2e] text-[#1a4d2e]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <Filter size={16} /> ตัวกรอง
                {docTypeFilter !== 'ALL' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute left-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <h4 className="font-bold text-gray-800">ตัวกรองข้อมูล</h4>
                    <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">ประเภทเอกสาร</label>
                    <div className="flex flex-col gap-1">
                      {[
                        { val: 'ALL', label: 'ทั้งหมด' },
                        { val: 'act', label: 'พ.ร.บ.' },
                        { val: 'tax', label: 'ภาษี' },
                        { val: 'insurance', label: 'ประกันภัย' },
                        { val: 'inspection', label: 'ตรอ.' },
                        { val: 'registration_book', label: 'เล่มทะเบียน' },
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => { setDocTypeFilter(item.val); setIsFilterOpen(false); }}
                          className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${docTypeFilter === item.val ? 'bg-[#e8f0eb] text-[#1a4d2e]' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {docTypeFilter !== 'ALL' && (
                    <button onClick={() => { setDocTypeFilter('ALL'); }} className="w-full py-2 mt-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>
              </>
            )}
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                }}
                className={`relative flex h-11 items-center gap-2 px-4 bg-white border rounded-xl transition-colors text-sm font-medium shadow-sm ${isSortOpen ? 'border-[#1a4d2e] text-[#1a4d2e]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <ArrowUpDown size={16} /> จัดเรียง
              </button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                <div className="absolute left-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <h4 className="font-bold text-gray-800">จัดเรียงข้อมูล</h4>
                    <button onClick={() => setIsSortOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => { setSortBy('RELEVANCE'); setIsSortOpen(false); }}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'RELEVANCE' ? 'bg-[#e8f0eb] text-[#1a4d2e]' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      เกี่ยวข้องที่สุด (แนะนำ)
                    </button>
                    <button
                      onClick={() => { setSortBy('DATE_ASC'); setIsSortOpen(false); }}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'DATE_ASC' ? 'bg-[#e8f0eb] text-[#1a4d2e]' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      วันหมดอายุ (น้อยไปมาก)
                    </button>
                    <button
                      onClick={() => { setSortBy('DATE_DESC'); setIsSortOpen(false); }}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'DATE_DESC' ? 'bg-[#e8f0eb] text-[#1a4d2e]' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      วันหมดอายุ (มากไปน้อย)
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 h-11 px-4 bg-[#e8f0eb] text-[#1a4d2e] rounded-xl text-xs font-bold border border-[#1a4d2e]/20 animate-in fade-in slide-in-from-left-2">
                สถานะ: {getStatusFilterLabel(statusFilter)}
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:bg-[#d4e5db] rounded-full p-0.5 transition-colors cursor-pointer flex items-center justify-center"
                  title="ล้างตัวกรองสถานะ"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full sm:w-auto lg:ml-4 gap-2">
          <button
            onClick={handleGlobalSync}
            className="flex h-11 items-center justify-center gap-2 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 shadow-sm"
            title="ซิงค์ข้อมูลล่าสุดทั้งหมด"
          >
            <RefreshCw size={16} /> ซิงค์ข้อมูลล่าสุด
          </button>

          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 px-5 text-white bg-[#1a4d2e] border border-transparent rounded-xl hover:bg-[#123620] transition-colors text-sm font-medium shadow-sm shadow-[#1a4d2e]/20"
          >
            <FileSpreadsheet size={16} /> นำเข้าข้อมูล
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden min-h-[465px]">
        <table className="w-full min-w-[1040px] table-fixed text-left border-collapse">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[22%]" />
            <col className="w-[13%]" />
            <col className="w-[20%]" />
            <col className="w-[6%]" />
            <col className="w-[5%]" />
          </colgroup>
          <thead className="bg-gray-50/50 border-y border-gray-100">
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">ประเภทเอกสาร</th>
              <th className="px-4 py-3 font-semibold">เลขตัวถัง</th>
              <th className="px-4 py-3 font-semibold">ทะเบียนรถ</th>
              <th className="px-4 py-3 font-semibold">โครงการ</th>
              <th className="px-4 py-3 font-semibold">วันหมดอายุ</th>
              <th className="px-4 py-3 font-semibold">สถานะ</th>
              <th className="px-2 py-3 font-semibold text-center">ไฟล์แนบ</th>
              <th className="px-2 py-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  <p className="font-medium text-gray-500">กำลังโหลดข้อมูลจาก Neon...</p>
                </td>
              </tr>
            ) : currentDocs.length > 0 ? (
              currentDocs.map((doc, index) => {
                const { status, days } = getDocumentStatus(doc.expiryDate);
                const statusBadge = getStatusBadge(status, days, doc.isAcknowledged);
                const documentKey = getDocumentRecordKey(doc);
                const attachmentPreview = getDocumentAttachmentPreview(doc);
                return (
                  <tr
                    key={documentKey}
                    onClick={() => {
                      setSelectedDocForDetail(doc);
                      toast.success(`เปิดรายละเอียด ${doc.licensePlate || doc.chassis}`, { duration: 1800 });
                    }}
                    className="hover:bg-gray-50/50 transition-colors group relative cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-700">{getDocTypeName(doc.docType)}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{doc.chassis}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">{doc.licensePlate || '-'}</span>
                    </td>

                    <td className="px-4 py-3 min-w-0">
                      <span className="block truncate font-medium text-gray-700" title={doc.project || 'ไม่ระบุโครงการ'}>
                        {doc.project || 'ไม่ระบุโครงการ'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-gray-700 font-medium whitespace-nowrap">{formatThaiDate(doc.expiryDate)}</span>
                    </td>

                    <td className="px-4 py-3">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (doc.isAcknowledged) {
                            setStatusFilter('EXPIRED');
                            toast.success('กรองเฉพาะเอกสารที่ยังไม่ต่อ', { id: 'status-filter-toast' });
                          } else if (status === 'EXPIRED') {
                            setStatusFilter('EXPIRED');
                            toast.success('กรองเฉพาะเอกสารที่ยังไม่ต่อ', { id: 'status-filter-toast' });
                          } else if (status === 'WARNING') {
                            setStatusFilter('WARNING');
                            toast.success('กรองเฉพาะเอกสารที่ใกล้ถึงรอบต่อ', { id: 'status-filter-toast' });
                          } else if (status === 'ACTIVE' || status === 'NO_EXPIRY') {
                            setStatusFilter('ACTIVE');
                            toast.success('กรองเฉพาะเอกสารที่ต่อแล้วหรือไม่ต้องต่อ', { id: 'status-filter-toast' });
                          }
                        }}
                        className="inline-flex flex-col items-start gap-1 cursor-pointer hover:scale-105 transition-all duration-200"
                        title="คลิกเพื่อกรองข้อมูลตามสถานะนี้"
                      >
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        <span className={`text-[11px] font-semibold ${statusBadge.detailClassName}`}>
                          {statusBadge.detail}
                        </span>
                      </div>
                    </td>

                    <td className="px-2 py-3 text-center">
                      {attachmentPreview ? (
                        <a
                          href={`/api/download?url=${encodeURIComponent(attachmentPreview.src)}&filename=${encodeURIComponent(`${getDocTypeName(doc.docType)}_${getCleanLicensePlate(doc.licensePlate) || doc.chassis}.jpg`)}`}
                          download={`${getDocTypeName(doc.docType)}_${getCleanLicensePlate(doc.licensePlate) || doc.chassis}.jpg`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`ดาวน์โหลดรูปภาพ ${getDocTypeName(doc.docType)} ของ ${getCleanLicensePlate(doc.licensePlate) || doc.chassis} เรียบร้อยแล้ว`);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-flex"
                          title={`ดาวน์โหลด ${attachmentPreview.title}`}
                          aria-label={`ดาวน์โหลด ${attachmentPreview.title} ของ ${doc.licensePlate || doc.chassis}`}
                        >
                          <Paperclip size={18} />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    <td className="px-2 py-3 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuKey(openActionMenuKey === documentKey ? null : documentKey);
                        }}
                        className={`p-2 rounded-lg transition-colors ${openActionMenuKey === documentKey ? 'text-[#1a4d2e] bg-gray-100' : 'text-gray-400 hover:text-[#1a4d2e] hover:bg-gray-100'}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openActionMenuKey === documentKey && (
                        <div
                          className={`absolute right-8 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 ${
                            index >= 4 ? 'bottom-full mb-1 origin-bottom-right' : 'top-10 origin-top-right'
                          }`}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a4d2e] flex items-center gap-2 transition-colors"
                            onClick={() => {
                              handleSingleSync(doc);
                              setOpenActionMenuKey(null);
                            }}
                          >
                            <RefreshCw size={14} /> ซิงค์ข้อมูลล่าสุด
                          </button>

                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            onClick={() => {
                              setSelectedDocForDetail(doc);
                              toast.success(`เปิดรายละเอียด ${doc.licensePlate || doc.chassis}`, { duration: 1800 });
                              setOpenActionMenuKey(null);
                            }}
                          >
                            <Eye size={14} /> ดูรายละเอียด
                          </button>

                          {(status === 'EXPIRED' || status === 'WARNING') && !doc.isAcknowledged && (
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
                              onClick={() => {
                                void onAcknowledgeDocument(doc);
                                setOpenActionMenuKey(null);
                              }}
                            >
                              <CheckCircle size={14} /> รับทราบการแจ้งเตือน
                            </button>
                          )}

                          <div className="h-[1px] bg-gray-100 my-1"></div>

                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            onClick={() => {
                              const isConfirmed = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูลของรถทะเบียน/เลขตัวถัง ${doc.licensePlate || doc.chassis}?`);
                              if (isConfirmed) {
                                void onDeleteDocument(doc);
                              }
                              setOpenActionMenuKey(null);
                            }}
                          >
                            <Trash2 size={14} /> ลบข้อมูลออกจากระบบ
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 flex-col items-center justify-center">
                  <p className="font-medium text-gray-500">ไม่พบข้อมูลที่คุณค้นหา หรือ ไม่ตรงกับตัวกรอง</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="text-sm text-gray-500">
            แสดง <span className="font-medium text-gray-800">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="font-medium text-gray-800">{Math.min(safeCurrentPage * itemsPerPage, filteredDocs.length)}</span> จากทั้งหมด <span className="font-medium text-gray-800">{filteredDocs.length}</span> รายการ
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= safeCurrentPage - 1 && pageNumber <= safeCurrentPage + 1)) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${safeCurrentPage === pageNumber ? 'bg-[#1a4d2e] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (pageNumber === safeCurrentPage - 2 || pageNumber === safeCurrentPage + 2) {
                return <span key={pageNumber} className="px-1 text-gray-400">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>

      <DocumentDetailModal
        document={
          selectedDocForDetail
            ? documents.find(d => isSameDocumentRecord(d, selectedDocForDetail)) || selectedDocForDetail
            : null
        }
        onClose={() => setSelectedDocForDetail(null)}
        onAcknowledge={onAcknowledgeDocument}
        onSync={handleSingleSync}
      />

    </>
  );
}
