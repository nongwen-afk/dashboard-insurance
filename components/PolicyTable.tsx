"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Search, Filter, FileSpreadsheet, Paperclip, MoreHorizontal, 
  ChevronLeft, ChevronRight, X, ArrowUpDown, 
  Eye, RefreshCw, Trash2, CheckCircle, Car, CalendarDays, FileText, User, Building2 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

type VehicleDocType = 'act' | 'tax' | 'insurance' | 'inspection' | 'registration_book';

interface VehicleDocument {
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
}

type DocStatus = 'EXPIRED' | 'WARNING' | 'ACTIVE' | 'NO_EXPIRY';
type SortOption = 'RELEVANCE' | 'DATE_ASC' | 'DATE_DESC';

interface PolicyTableProps {
  documents: VehicleDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<VehicleDocument[]>>;
}

export default function PolicyTable({ documents, setDocuments }: PolicyTableProps) {
  const [searchInput, setSearchInput] = useState('');     
  const [activeSearch, setActiveSearch] = useState('');   
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL'); 

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('RELEVANCE'); 

  const [openActionMenuIndex, setOpenActionMenuIndex] = useState<number | null>(null);

  // 📍 State สำหรับเปิด/ปิด Popup รายละเอียด และเก็บข้อมูลรถคันที่กดดู
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<VehicleDocument | null>(null);

  const formatThaiDate = (dateString?: string) => {
    if (!dateString) return '-';
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const getDocumentStatus = (expiryDate?: string): { status: DocStatus; days: number } => {
    if (!expiryDate) return { status: 'NO_EXPIRY', days: 0 }; 
    const diffDays = Math.ceil((new Date(expiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'EXPIRED', days: diffDays };
    if (diffDays <= 30) return { status: 'WARNING', days: diffDays };
    return { status: 'ACTIVE', days: diffDays };
  };

  const getDocTypeName = (type: VehicleDocType) => {
    const types: Record<string, string> = { act: 'พ.ร.บ.', tax: 'ภาษี', insurance: 'ประกันภัย', inspection: 'ตรอ.', registration_book: 'เล่มทะเบียน' };
    return types[type] || type;
  };

  useEffect(() => {
    const searchToastId = 'search-toast';

    const timer = setTimeout(() => {
      if (searchInput !== activeSearch) {
        if (searchInput.trim() !== '') {
          toast.loading(`กำลังค้นหา "${searchInput}"...`, { id: searchToastId });
          
          setTimeout(() => {
            setActiveSearch(searchInput); 
            
            const query = searchInput.toLowerCase();
            const foundCount = documents.filter((doc) => {
              const docTypeName = getDocTypeName(doc.docType).toLowerCase();
              const matchSearch = 
                  doc.chassis.toLowerCase().includes(query) || 
                  (doc.licensePlate?.toLowerCase() || '').includes(query) ||
                  docTypeName.includes(query);

              const matchDocType = docTypeFilter === 'ALL' || doc.docType === docTypeFilter;
              return matchSearch && matchDocType;
            }).length;

            if (foundCount > 0) {
              toast.success(`พบข้อมูล ${foundCount} รายการ`, { id: searchToastId });
            } else {
              toast.error(`ไม่พบข้อมูล "${searchInput}"`, { id: searchToastId });
            }
          }, 600); 

        } else {
          setActiveSearch('');
          toast.dismiss(searchToastId);
        }
      }
    }, 500); 

    return () => clearTimeout(timer);
  }, [searchInput, activeSearch, documents, docTypeFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('กำลังประมวลผลไฟล์...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as (string | number | undefined)[][]; 
        
        const newImportedDocs: VehicleDocument[] = [];
        for (let i = 1; i < data.length; i++) {
           const row = data[i];
           if (!row || row.length === 0 || !row[0]) continue;
           
           newImportedDocs.push({
             chassis: String(row[0] || `CHAS-${Date.now()}-${i}`),
             licensePlate: String(row[1] || ''),
             project: String(row[2] || ''),
             docType: (String(row[3] || 'act').toLowerCase()) as VehicleDocType,
             issuer: String(row[4] || ''),
             docNumber: String(row[5] || ''),
             issuedDate: row[6] ? String(row[6]) : undefined,
             expiryDate: row[7] ? String(row[7]) : undefined,
             hasAttachment: i % 3 !== 0, 
           });
        }
        
        if (newImportedDocs.length > 0) {
          setDocuments(prev => [...newImportedDocs, ...prev]);
          setCurrentPage(1); 
          toast.success(`นำเข้าข้อมูลสำเร็จ ${newImportedDocs.length} รายการ`, { id: loadingToast });
        } else {
          toast.error('ไม่พบข้อมูลในไฟล์ Excel', { id: loadingToast });
        }
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์', { id: loadingToast });
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredDocs = useMemo(() => {
    const query = activeSearch.toLowerCase();
    
    const filtered = documents.filter((doc) => {
      const docTypeName = getDocTypeName(doc.docType).toLowerCase();
      const matchSearch = 
          doc.chassis.toLowerCase().includes(query) || 
          (doc.licensePlate?.toLowerCase() || '').includes(query) ||
          docTypeName.includes(query);
      
      const matchDocType = docTypeFilter === 'ALL' || doc.docType === docTypeFilter;

      return matchSearch && matchDocType;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'RELEVANCE') {
        const statusA = getDocumentStatus(a.expiryDate);
        const statusB = getDocumentStatus(b.expiryDate);
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
        if (!a.expiryDate) return 1; 
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      else if (sortBy === 'DATE_DESC') {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
      }
      return 0;
    });
  }, [documents, activeSearch, docTypeFilter, sortBy]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  
  const currentDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocs, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionMenuIndex !== null) {
        setOpenActionMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionMenuIndex]);

  const hasActiveFilters = docTypeFilter !== 'ALL';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      
      <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาทะเบียน, ประเภทเอกสาร..." 
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d2e] transition-all"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
                setIsSortOpen(false); 
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl transition-colors text-sm font-medium shadow-sm ${isFilterOpen ? 'border-[#1a4d2e] text-[#1a4d2e]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter size={16} /> ตัวกรอง
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
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
                  
                  {hasActiveFilters && (
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
              className={`relative flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl transition-colors text-sm font-medium shadow-sm ${isSortOpen ? 'border-[#1a4d2e] text-[#1a4d2e]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <ArrowUpDown size={16} /> จัดเรียง
            </button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
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

          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 text-white bg-[#1a4d2e] border border-transparent rounded-xl hover:bg-[#123620] transition-colors text-sm font-medium shadow-sm shadow-[#1a4d2e]/20"
          >
            <FileSpreadsheet size={16} /> นำเข้า Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-y border-gray-100">
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">ประเภทเอกสาร</th>
              <th className="px-6 py-4 font-semibold">เลขตัวถัง</th>
              <th className="px-6 py-4 font-semibold">ทะเบียนรถ</th>
              <th className="px-6 py-4 font-semibold">วันที่มีผล</th>
              <th className="px-6 py-4 font-semibold">วันหมดอายุ</th>
              <th className="px-6 py-4 font-semibold text-center">ไฟล์แนบ</th>
              <th className="px-6 py-4 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {currentDocs.length > 0 ? (
              currentDocs.map((doc, index) => {
                const { status, days } = getDocumentStatus(doc.expiryDate);
                return (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors group relative">
                    <td className="px-6 py-4 font-medium text-gray-700">{getDocTypeName(doc.docType)}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{doc.chassis}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-800">{doc.licensePlate || '-'}</span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{formatThaiDate(doc.issuedDate)}</span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">{formatThaiDate(doc.expiryDate)}</span>
                        {status === 'WARNING' && <span className="text-[10px] text-yellow-600 font-bold mt-0.5">เหลืออีก {days} วัน</span>}
                        {status === 'EXPIRED' && <span className="text-[10px] text-red-600 font-bold mt-0.5">เลยกำหนดมาแล้ว {Math.abs(days)} วัน</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {doc.hasAttachment ? (
                        <button className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors inline-flex" title="ดูไฟล์แนบ">
                          <Paperclip size={18} />
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuIndex(openActionMenuIndex === index ? null : index);
                        }}
                        className={`p-2 rounded-lg transition-colors ${openActionMenuIndex === index ? 'text-[#1a4d2e] bg-gray-100' : 'text-gray-400 hover:text-[#1a4d2e] hover:bg-gray-100'}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openActionMenuIndex === index && (
                        <div 
                          className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a4d2e] flex items-center gap-2 transition-colors"
                            onClick={() => { 
                              toast.success(`ซิงค์ข้อมูล ${doc.licensePlate || doc.chassis} แล้ว`, { duration: 3000 }); 
                              setOpenActionMenuIndex(null); 
                            }}
                          >
                            <RefreshCw size={14} /> ซิงค์ข้อมูลล่าสุด
                          </button>
                          
                          {/* 📍 ปรับปุ่มดูรายละเอียด ให้เซ็ตข้อมูลลง State เพื่อเปิด Popup */}
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            onClick={() => { 
                              setSelectedDocForDetail(doc);
                              setIsDetailModalOpen(true);
                              setOpenActionMenuIndex(null); 
                            }}
                          >
                            <Eye size={14} /> ดูรายละเอียด
                          </button>

                          {status === 'EXPIRED' && (
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
                              onClick={() => { 
                                toast.success(`รับทราบแจ้งเตือน ${doc.licensePlate || doc.chassis}`); 
                                setOpenActionMenuIndex(null); 
                              }}
                            >
                              <CheckCircle size={14} /> รับทราบการแจ้งเตือน
                            </button>
                          )}

                          <div className="h-[1px] bg-gray-100 my-1"></div>

                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            onClick={() => { 
                              toast.error(`จำลองการลบข้อมูล ${doc.licensePlate || doc.chassis}`); 
                              setOpenActionMenuIndex(null); 
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
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 flex-col items-center justify-center">
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
            แสดง <span className="font-medium text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="font-medium text-gray-800">{Math.min(currentPage * itemsPerPage, filteredDocs.length)}</span> จากทั้งหมด <span className="font-medium text-gray-800">{filteredDocs.length}</span> รายการ
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNumber ? 'bg-[#1a4d2e] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return <span key={pageNumber} className="px-1 text-gray-400">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===================== Popup แสดงรายละเอียดเอกสารแบบเต็ม ===================== */}
      {isDetailModalOpen && selectedDocForDetail && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-[#e8f0eb] p-2.5 rounded-xl text-[#1a4d2e]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">รายละเอียดข้อมูลเอกสาร</h3>
                  <p className="text-xs text-gray-500">ประเภท: {getDocTypeName(selectedDocForDetail.docType)}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors border border-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* ส่วนข้อมูลรถ */}
              <div>
                <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
                  <Car size={16} /> ข้อมูลยานพาหนะ
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-y-4 gap-x-6 border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ทะเบียนรถ</p>
                    <p className="font-bold text-gray-800 text-base">{selectedDocForDetail.licensePlate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">เลขตัวถัง / Chassis</p>
                    <p className="font-mono text-gray-700 font-medium">{selectedDocForDetail.chassis || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">โครงการ / Project</p>
                    <p className="font-medium text-gray-700">{selectedDocForDetail.project || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* ส่วนข้อมูลเอกสาร และข้อมูลที่ถูกซ่อนไปจากตาราง */}
              <div>
                <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
                  <CalendarDays size={16} /> ข้อมูลเอกสารและความคุ้มครอง
                </h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">วันที่มีผล (Issued Date)</p>
                    <p className="font-medium text-gray-800">{formatThaiDate(selectedDocForDetail.issuedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">วันหมดอายุ (Expiry Date)</p>
                    <p className="font-medium text-gray-800">{formatThaiDate(selectedDocForDetail.expiryDate)}</p>
                  </div>
                  
                  {/* 📍 ข้อมูลที่ซ่อนจากตารางหลัก นำมาแสดงตรงนี้ */}
                  <div className="col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-1">
                          <User size={12} /> ผู้รับผิดชอบ (Driver)
                        </p>
                        <p className="font-medium text-gray-800">{selectedDocForDetail.driverName || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-1">
                          <Building2 size={12} /> บริษัทประกัน/ผู้ออกเอกสาร
                        </p>
                        <p className="font-medium text-gray-800">{selectedDocForDetail.issuer || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">หมายเลขเอกสาร/กรมธรรม์</p>
                    <p className="font-medium text-gray-800">{selectedDocForDetail.docNumber || 'ไม่มีข้อมูล'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-bold transition-all shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}