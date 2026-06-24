"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react';
import type { VehicleDocument, CalendarNote } from '@/types';
import {
  formatDateOnly,
  formatThaiDate,
  getDaysUntilExpiry,
  getDocTypeName,
  getDocumentRecordKey,
  getCleanLicensePlate,
  parseDocumentDate,
} from '@/utils/documentUtils';

interface ExpiryChartProps {
  documents: VehicleDocument[];
  notes?: CalendarNote[];
  onSelectDocument: (document: VehicleDocument) => void;
  onAddDocument?: (dateStr: string) => void;
  onAddNote?: (dateStr: string) => void;
  onDeleteNote?: (id: string) => void;
}

const THAI_MONTHS_FULL_CORRECT = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const WEEKDAY_LABELS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

const getMonthLabel = (date: Date) => `${THAI_MONTHS_FULL_CORRECT[date.getMonth()]} ${date.getFullYear() + 543}`;

const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getCalendarStart = (month: Date) => {
  const firstDay = getStartOfMonth(month);
  const sundayOffset = firstDay.getDay(); // 0 is Sunday, 1 is Monday...
  const mondayOffset = sundayOffset === 0 ? 6 : sundayOffset - 1;
  return new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - mondayOffset);
};

const isRenewalActionDocument = (document: VehicleDocument) => {
  if (document.isAcknowledged) return true;
  const days = getDaysUntilExpiry(document.expiryDate);
  return days <= 30;
};

const getRenewalTone = (document: VehicleDocument) => {
  if (document.isAcknowledged) {
    return {
      label: 'ต้องต่อแล้ว',
      className: 'border-red-100 bg-red-50/70 text-red-700',
      dotClassName: 'bg-red-500',
      tagClassName: 'bg-red-500/10 border-red-500/25 text-red-800 hover:bg-red-500/20',
    };
  }

  const days = getDaysUntilExpiry(document.expiryDate);
  if (days < 0) {
    return {
      label: 'ต้องต่อแล้ว',
      className: 'border-red-100 bg-red-50/70 text-red-700',
      dotClassName: 'bg-red-500',
      tagClassName: 'bg-red-500/10 border-red-500/25 text-red-800 hover:bg-red-500/20',
    };
  }

  return {
    label: 'ใกล้ถึงรอบต่อ',
    className: 'border-orange-100 bg-orange-50/70 text-orange-700',
    dotClassName: 'bg-orange-500',
    tagClassName: 'bg-orange-500/10 border-orange-500/25 text-orange-800 hover:bg-orange-500/20',
  };
};

const getDaysLabel = (document: VehicleDocument) => {
  if (document.isAcknowledged) return 'ยังไม่พบข้อมูลต่ออายุ';

  const days = getDaysUntilExpiry(document.expiryDate);
  if (days < 0) return `เลยกำหนด ${Math.abs(days)} วัน`;
  if (days === 0) return 'ถึงรอบวันนี้';
  return `เหลืออีก ${days} วัน`;
};

export default function ExpiryChart({
  documents,
  notes = [],
  onSelectDocument,
  onAddDocument,
  onAddNote,
  onDeleteNote,
}: ExpiryChartProps) {
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิดเมนู dropdown เมื่อคลิกภายนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // กรองเฉพาะเอกสารที่ใกล้หมดอายุหรือเลยกำหนด (และยังไม่ต่อ)
  const actionableDocs = useMemo(() => {
    return documents
      .filter((doc) => parseDocumentDate(doc.expiryDate))
      .filter(isRenewalActionDocument)
      .sort((a, b) => {
        const dateA = parseDocumentDate(a.expiryDate)?.getTime() || 0;
        const dateB = parseDocumentDate(b.expiryDate)?.getTime() || 0;
        return dateA - dateB;
      });
  }, [documents]);

  // จัดกลุ่มข้อมูลเอกสารตามวันที่
  const docsByDayMap = useMemo(() => {
    const map = new Map<string, VehicleDocument[]>();
    actionableDocs.forEach((doc) => {
      const expDate = parseDocumentDate(doc.expiryDate);
      if (!expDate) return;
      const key = formatDateOnly(expDate);
      const list = map.get(key) || [];
      list.push(doc);
      map.set(key, list);
    });
    return map;
  }, [actionableDocs]);

  // จัดกลุ่มโน้ตเตือนความจำตามวันที่
  const notesByDayMap = useMemo(() => {
    const map = new Map<string, CalendarNote[]>();
    notes.forEach((note) => {
      const key = note.noteDate;
      const list = map.get(key) || [];
      list.push(note);
      map.set(key, list);
    });
    return map;
  }, [notes]);

  // ปรับการคำนวณวันในปฏิทินแบบ 42 วัน
  const calendarDays = useMemo(() => {
    const start = getCalendarStart(activeDate);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = formatDateOnly(date);
      const isCurrentMonth = date.getMonth() === activeDate.getMonth();
      return {
        date,
        key,
        docs: isCurrentMonth ? docsByDayMap.get(key) || [] : [],
        notes: isCurrentMonth ? notesByDayMap.get(key) || [] : [],
        isCurrentMonth,
      };
    });
  }, [docsByDayMap, notesByDayMap, activeDate]);

  // ดึงวันที่มีการแจ้งเตือนงานวันแรก หรือ default เป็นวันแรกของเดือน
  const activeDayKey = selectedDayKey || formatDateOnly(activeDate);
  const activeDocs = docsByDayMap.get(activeDayKey) || [];
  const activeNotes = notesByDayMap.get(activeDayKey) || [];

  // สรุปยอดนับรวมในเดือนนั้น ๆ
  const monthDocs = calendarDays.filter((day) => day.isCurrentMonth).flatMap((day) => day.docs);
  const dueNowCount = monthDocs.filter((doc) => doc.isAcknowledged || getDaysUntilExpiry(doc.expiryDate) < 0).length;
  const upcomingCount = monthDocs.filter((doc) => {
    if (doc.isAcknowledged) return false;
    const days = getDaysUntilExpiry(doc.expiryDate);
    return days >= 0 && days <= 30;
  }).length;

  // การนำทางเปลี่ยนปฏิทิน
  const handleNavigate = (direction: -1 | 1) => {
    setActiveDate((current) => {
      const next = new Date(current);
      if (viewMode === 'month') {
        next.setMonth(current.getMonth() + direction);
      } else if (viewMode === 'week') {
        next.setDate(current.getDate() + direction * 7);
      } else if (viewMode === 'day') {
        next.setDate(current.getDate() + direction);
      }
      setSelectedDayKey(formatDateOnly(next));
      return next;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setActiveDate(today);
    setSelectedDayKey(formatDateOnly(today));
  };

  // แถบช่วงวันของสัปดาห์
  const weekRangeLabel = useMemo(() => {
    const sundayOffset = activeDate.getDay();
    const mondayOffset = sundayOffset === 0 ? 6 : sundayOffset - 1;
    const startOfWeek = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - mondayOffset);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = `${startOfWeek.getDate()} ${THAI_MONTHS_FULL_CORRECT[startOfWeek.getMonth()].slice(0, 3)}.`;
    const endStr = `${endOfWeek.getDate()} ${THAI_MONTHS_FULL_CORRECT[endOfWeek.getMonth()].slice(0, 3)}. ${endOfWeek.getFullYear() + 543}`;
    return `${startStr} - ${endStr}`;
  }, [activeDate]);

  // วันและสัปดาห์ที่ใช้งานจริงใน Week View
  const weekDays = useMemo(() => {
    const sundayOffset = activeDate.getDay();
    const mondayOffset = sundayOffset === 0 ? 6 : sundayOffset - 1;
    const startOfWeek = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const key = formatDateOnly(date);
      return {
        date,
        key,
        docs: docsByDayMap.get(key) || [],
        notes: notesByDayMap.get(key) || [],
      };
    });
  }, [docsByDayMap, notesByDayMap, activeDate]);

  return (
    <section className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col w-full overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-slate-100">
        {/* แถวที่ 1: ชื่อหัวข้อและรายละเอียด */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-[#1a4d2e]" size={20} />
            ปฏิทินต่ออายุเอกสาร
          </h3>
          <p className="text-sm text-gray-500">แสดงเฉพาะป้ายภาษีและ พ.ร.บ. ที่ต้องต่อ</p>
        </div>

        {/* แถวที่ 2: ปุ่มควบคุมทั้งหมดและปุ่มบวกสร้างงานอยู่ระดับเดียวกัน */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* ส่วนซ้าย: ปุ่มนำทาง และปุ่มสลับมุมมอง */}
          <div className="flex flex-wrap items-center gap-3">
            {/* ส่วนปุ่มนำทางและปุ่มเดือนรวมในกรอบครอบเดียวกัน */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50 shadow-xs shrink-0">
              <button
                type="button"
                onClick={handleToday}
                className="h-8 px-3 rounded-lg text-xs font-extrabold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                วันนี้
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-1 shrink-0" />
              <button
                type="button"
                onClick={() => handleNavigate(-1)}
                className="h-8 w-8 rounded-lg text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center shrink-0"
                aria-label="ย้อนกลับ"
              >
                <ChevronLeft size={15} />
              </button>

              {/* ช่วงวันที่แสดงตรงกลาง */}
              <span className="text-xs font-extrabold text-slate-700 min-w-[150px] px-2 text-center shrink-0 select-none">
                {viewMode === 'month' && getMonthLabel(activeDate)}
                {viewMode === 'week' && weekRangeLabel}
                {viewMode === 'day' && formatThaiDate(formatDateOnly(activeDate))}
                {viewMode === 'agenda' && 'กำหนดการทั้งหมด'}
              </span>

              <button
                type="button"
                onClick={() => handleNavigate(1)}
                className="h-8 w-8 rounded-lg text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center shrink-0"
                aria-label="ถัดไป"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* ปุ่มสลับมุมมอง */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/50 shadow-xs shrink-0">
              {(['month', 'week', 'day', 'agenda'] as const).map((mode) => {
                const labelMap = { month: 'เดือน', week: 'สัปดาห์', day: 'วัน', agenda: 'วาระ' };
                const isSelected = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setViewMode(mode);
                      if (mode === 'day') {
                        setSelectedDayKey(formatDateOnly(activeDate));
                      }
                    }}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-[#1a4d2e] shadow-xs font-extrabold border border-slate-200/20'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {labelMap[mode]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ส่วนขวา: ปุ่มสร้างหลัก (+ สร้าง) สไตล์ Google Calendar */}
          <div className="relative shrink-0 self-start md:self-auto ml-auto md:ml-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex h-9 px-4 items-center gap-2 rounded-2xl bg-[#3c4043] hover:bg-[#4f5357] text-xs font-extrabold text-white shadow-md transition-all select-none cursor-pointer"
            >
              <Plus size={15} className="stroke-[3] text-white" />
              <span>สร้าง</span>
              <span className="ml-1 border-t-4 border-t-white border-x-4 border-x-transparent" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#303134] border border-slate-700 shadow-xl z-30 overflow-hidden py-1">
                {onAddDocument && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onAddDocument(formatDateOnly(activeDate));
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-extrabold text-slate-100 hover:bg-[#3c4043] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={13} className="text-slate-100" />
                    เพิ่มเอกสารต่ออายุ
                  </button>
                )}
                {onAddNote && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onAddNote(formatDateOnly(activeDate));
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-extrabold text-slate-100 hover:bg-[#3c4043] transition-colors flex items-center gap-2 border-t border-slate-700 cursor-pointer"
                  >
                    <Plus size={13} className="text-slate-100" />
                    เพิ่มโน้ตเตือนความจำ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. สรุป Counts ย่อ */}
      {viewMode !== 'agenda' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-red-600">ต้องต่อแล้ว</span>
            <span className="text-base font-extrabold text-red-700">{dueNowCount}</span>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600">ใกล้ถึงรอบต่อ</span>
            <span className="text-base font-extrabold text-orange-700">{upcomingCount}</span>
          </div>
        </div>
      )}

      {/* 3. Calendar View Renderers */}
      <div className="flex-1 min-h-[380px] w-full">
        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 h-full">
            <div className="min-w-0">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAY_LABELS.map((lbl) => (
                  <div key={lbl} className="text-center text-[10px] font-bold text-slate-400">
                    {lbl}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isSelected = day.key === activeDayKey;
                  const hasOverdue = day.docs.some((d) => d.isAcknowledged || getDaysUntilExpiry(d.expiryDate) < 0);
                  
                  // จัดรวมรายการเพื่อนำมาแสดงในช่องปฏิทิน (ไม่เกิน 2 รายการ)
                  const cellItems: Array<{ type: 'doc'; data: VehicleDocument } | { type: 'note'; data: CalendarNote }> = [];
                  day.docs.forEach((doc) => cellItems.push({ type: 'doc', data: doc }));
                  day.notes.forEach((note) => cellItems.push({ type: 'note', data: note }));

                  const displayItems = cellItems.slice(0, 2);
                  const extraCount = cellItems.length - displayItems.length;

                  return (
                    <div
                      key={day.key}
                      onClick={() => {
                        if (day.isCurrentMonth) {
                          setSelectedDayKey(day.key);
                          setActiveDate(day.date);
                        }
                      }}
                      className={`min-h-16 rounded-xl border p-1.5 flex flex-col justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1a4d2e] bg-[#e8f0eb]/60 shadow-xs ring-1 ring-[#1a4d2e]/30'
                          : day.isCurrentMonth
                            ? 'border-slate-100 bg-white hover:border-[#1a4d2e]/20 hover:bg-[#e8f0eb]/20'
                            : 'border-slate-50 bg-slate-50/40 text-slate-300 pointer-events-none'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold ${day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                          {day.date.getDate()}
                        </span>
                        <div className="flex gap-0.5">
                          {day.docs.length > 0 && (
                            <span className={`h-1.5 w-1.5 rounded-full ${hasOverdue ? 'bg-red-500' : 'bg-orange-500'}`} />
                          )}
                          {day.notes.length > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                      </div>

                      {/* รายการป้ายการหมดอายุสั้น ๆ หรือ โน้ตย่อ (Strips) */}
                      <div className="mt-1 space-y-0.5 flex-1 flex flex-col justify-end">
                        {day.isCurrentMonth && displayItems.map((item) => {
                          if (item.type === 'doc') {
                            const doc = item.data;
                            const tone = getRenewalTone(doc);
                            const plate = getCleanLicensePlate(doc.licensePlate) || doc.chassis.slice(-4);
                            return (
                              <button
                                key={getDocumentRecordKey(doc)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectDocument(doc);
                                }}
                                className={`w-full block text-left px-1 py-0.5 rounded-sm border text-[8px] font-bold truncate leading-tight transition-all ${tone.tagClassName}`}
                              >
                                {getDocTypeName(doc.docType)} · {plate}
                              </button>
                            );
                          } else {
                            const note = item.data;
                            return (
                              <div
                                key={note.id}
                                className="w-full block text-left px-1 py-0.5 rounded-sm border border-amber-200 bg-amber-50 text-amber-800 text-[8px] font-bold truncate leading-tight select-none"
                                title={note.content}
                              >
                                📝 {note.content}
                              </div>
                            );
                          }
                        })}
                        {day.isCurrentMonth && extraCount > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayKey(day.key);
                              setActiveDate(day.date);
                              setViewMode('day');
                            }}
                            className="text-[8px] font-extrabold text-[#1a4d2e] bg-green-50/50 text-center rounded-sm py-0.5 border border-green-100 hover:bg-green-100/50"
                          >
                            +{extraCount} รายการ
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar รายการของวันนั้น ๆ */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 flex flex-col min-w-0 h-[380px] xl:h-auto">
              <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400">วันที่เลือก</p>
                  <h4 className="text-sm font-extrabold text-slate-700 truncate">
                    {formatThaiDate(activeDayKey)}
                  </h4>
                </div>
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 text-[#1a4d2e] flex items-center justify-center shadow-xs shrink-0">
                  <CalendarDays size={15} />
                </div>
              </div>

              {/* ปุ่มบวกเพิ่มงาน & เพิ่มโน้ต ด้านข้าง */}
              <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                {onAddDocument && (
                  <button
                    type="button"
                    onClick={() => onAddDocument(activeDayKey)}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-dashed border-[#1a4d2e]/30 bg-[#e8f0eb]/30 hover:bg-[#e8f0eb]/60 text-[10px] font-extrabold text-[#1a4d2e] transition-all cursor-pointer"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    เพิ่มเอกสาร
                  </button>
                )}
                {onAddNote && (
                  <button
                    type="button"
                    onClick={() => onAddNote(activeDayKey)}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-dashed border-amber-500/30 bg-amber-50/30 hover:bg-amber-100/60 text-[10px] font-extrabold text-amber-800 transition-all cursor-pointer"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    เพิ่มโน้ต
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {/* ส่วนแสดงโน้ตเตือนความจำ */}
                {activeNotes.length > 0 && (
                  <div className="space-y-1.5 shrink-0">
                    <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                      <span>📝 โน้ตเตือนความจำ</span>
                      <span className="h-1 w-1 rounded-full bg-amber-500" />
                    </p>
                    {activeNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-amber-50/50 rounded-xl border border-amber-200/60 p-3 shadow-xs hover:bg-amber-50 transition-all flex items-start justify-between gap-3 group"
                      >
                        <p className="text-xs font-bold text-amber-900 whitespace-pre-wrap leading-relaxed flex-1">
                          {note.content}
                        </p>
                        {onDeleteNote && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0 md:opacity-0 group-hover:opacity-100"
                            title="ลบโน้ต"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ส่วนแสดงเอกสารต่ออายุ */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400">📋 เอกสารต่ออายุ</p>
                  {activeDocs.length > 0 ? (
                    activeDocs.map((doc) => {
                      const tone = getRenewalTone(doc);
                      return (
                        <div
                          key={getDocumentRecordKey(doc)}
                          onClick={() => onSelectDocument(doc)}
                          className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-xs hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-extrabold text-slate-800 truncate">
                              {doc.licensePlate || doc.chassis}
                            </p>
                            <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-extrabold ${tone.className}`}>
                              {tone.label}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            {getDocTypeName(doc.docType)} · {doc.project || 'ไม่ระบุโครงการ'}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-slate-500">
                            <span className="flex items-center gap-1"><Clock size={11} /> {getDaysLabel(doc)}</span>
                            <span>{formatThaiDate(doc.expiryDate)}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : activeNotes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                      <FileText size={24} className="text-slate-300 mb-1" />
                      <p className="text-xs font-bold">ไม่มีรายการในวันนี้</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 text-center py-4">ไม่มีเอกสารต่ออายุในวันนี้</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-2 h-full overflow-x-auto min-w-[700px] xl:min-w-0">
            {weekDays.map((day) => {
              const isToday = formatDateOnly(new Date()) === day.key;
              return (
                <div
                  key={day.key}
                  className={`rounded-2xl border p-2 flex flex-col gap-2 min-h-[350px] ${
                    isToday
                      ? 'border-[#1a4d2e] bg-[#e8f0eb]/30 shadow-xs'
                      : 'border-slate-100 bg-slate-50/20'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-slate-200/50 shrink-0 relative group flex flex-col items-center">
                    <p className={`text-[10px] font-bold ${isToday ? 'text-[#1a4d2e]' : 'text-slate-400'}`}>
                      {WEEKDAY_LABELS[(day.date.getDay() + 6) % 7]}
                    </p>
                    <p className={`text-base font-extrabold ${isToday ? 'text-[#1a4d2e]' : 'text-slate-700'}`}>
                      {day.date.getDate()}
                    </p>
                    
                    {/* ปุ่มบวกสำหรับ Week View แบบบล็อกประโปร่งใสเห็นชัดเจน */}
                    {onAddDocument && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddDocument(day.key);
                        }}
                        className="mt-1 h-6 w-full rounded-md border border-dashed border-slate-200 hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/30 text-slate-500 hover:text-[#1a4d2e] flex items-center justify-center transition-all"
                        title="เพิ่มงานในวันนี้"
                      >
                        <Plus size={11} className="stroke-[3]" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[300px]">
                    {/* แสดงโน้ตประจำวันในมุมมองสัปดาห์ */}
                    {day.notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-amber-50/60 p-2 rounded-xl border border-amber-200/50 shadow-xs hover:bg-amber-100/60 transition-all flex items-start justify-between gap-1 group"
                      >
                        <p className="text-[9px] font-bold text-amber-900 whitespace-pre-wrap leading-tight flex-1">
                          📝 {note.content}
                        </p>
                        {onDeleteNote && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                            }}
                            className="text-slate-400 hover:text-red-500 rounded transition-colors shrink-0 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="ลบโน้ต"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* แสดงเอกสารประจำวันในมุมมองสัปดาห์ */}
                    {day.docs.length > 0 ? (
                      day.docs.map((doc) => {
                        const tone = getRenewalTone(doc);
                        const cleanPlate = getCleanLicensePlate(doc.licensePlate) || doc.chassis.slice(-4);
                        return (
                          <div
                            key={getDocumentRecordKey(doc)}
                            onClick={() => onSelectDocument(doc)}
                            className="bg-white p-2 rounded-xl border border-slate-200/50 shadow-xs hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/30 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tone.dotClassName}`} />
                              <p className="text-[10px] font-extrabold text-slate-800 truncate">
                                {cleanPlate}
                              </p>
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 mt-0.5 truncate">
                              {getDocTypeName(doc.docType)}
                            </p>
                            <p className="text-[8px] font-extrabold text-[#1a4d2e] mt-1 shrink-0">
                              {getDaysLabel(doc)}
                            </p>
                          </div>
                        );
                      })
                    ) : day.notes.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-2 text-center text-[9px] font-bold text-slate-300">
                        ไม่มีงาน
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/20 max-w-2xl mx-auto h-full flex flex-col justify-between min-h-[350px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 mb-4 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400">กำหนดงานรายวัน</p>
                <h4 className="text-lg font-extrabold text-slate-800">{formatThaiDate(activeDayKey)}</h4>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {onAddDocument && (
                  <button
                    type="button"
                    onClick={() => onAddDocument(activeDayKey)}
                    className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg border border-[#1a4d2e]/20 bg-white text-[11px] font-extrabold text-[#1a4d2e] shadow-xs hover:bg-[#e8f0eb]/30 transition-all cursor-pointer"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    เพิ่มเอกสาร
                  </button>
                )}
                {onAddNote && (
                  <button
                    type="button"
                    onClick={() => onAddNote(activeDayKey)}
                    className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg border border-amber-500/20 bg-white text-[11px] font-extrabold text-amber-800 shadow-xs hover:bg-amber-50 transition-all cursor-pointer"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    เพิ่มโน้ต
                  </button>
                )}
                <span className="text-[11px] font-extrabold text-slate-500 bg-white border border-slate-200/60 px-3 py-1.5 rounded-lg">
                  พบทั้งหมด {activeDocs.length + activeNotes.length} รายการ
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[260px] pr-1 custom-scrollbar">
              {/* ส่วนแสดงโน้ตเตือนความจำในมุมมองรายวัน */}
              {activeNotes.length > 0 && (
                <div className="space-y-2 bg-amber-50/30 border border-amber-200/45 p-3 rounded-xl shrink-0">
                  <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                    <span>📝 โน้ตเตือนความจำประจำวัน</span>
                  </p>
                  <div className="space-y-1.5">
                    {activeNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-white rounded-xl border border-amber-200/50 p-3 shadow-xs flex items-center justify-between gap-4 group"
                      >
                        <p className="text-xs font-bold text-amber-900 whitespace-pre-wrap leading-relaxed flex-1">
                          {note.content}
                        </p>
                        {onDeleteNote && (
                          <button
                            type="button"
                            onClick={() => onDeleteNote(note.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="ลบโน้ต"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ส่วนแสดงเอกสารในมุมมองรายวัน */}
              {activeDocs.length > 0 ? (
                <div className="space-y-2">
                  {activeNotes.length > 0 && <p className="text-[10px] font-bold text-slate-400">📋 เอกสารต่ออายุ</p>}
                  {activeDocs.map((doc) => {
                    const tone = getRenewalTone(doc);
                    return (
                      <div
                        key={getDocumentRecordKey(doc)}
                        onClick={() => onSelectDocument(doc)}
                        className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-xs hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/20 transition-all flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-sm text-slate-800">{doc.licensePlate || doc.chassis}</h5>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold ${tone.className}`}>
                              {tone.label}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            {getDocTypeName(doc.docType)} · โครงการ: {doc.project || 'ไม่ระบุ'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-[#1a4d2e]">{getDaysLabel(doc)}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">หมดอายุ {formatThaiDate(doc.expiryDate)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : activeNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl">
                  <FileText size={32} className="text-slate-200 mb-2" />
                  <p className="text-sm font-bold">ไม่มีการแจ้งเตือนงานในวันนี้</p>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="mt-2 text-xs font-extrabold text-[#1a4d2e] hover:underline cursor-pointer"
                  >
                    กลับไปดูวันนี้
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* AGENDA VIEW */}
        {viewMode === 'agenda' && (
          <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-slate-50/20 w-full h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <h4 className="text-base font-extrabold text-slate-800">กำหนดการเรียงลำดับเวลา</h4>
              <span className="text-xs font-extrabold text-slate-500 bg-white border border-slate-200/60 px-3 py-1 rounded-lg">
                รอต่ออายุ {actionableDocs.length} รายการ
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[320px] pr-1 custom-scrollbar">
              {actionableDocs.length > 0 ? (
                actionableDocs.map((doc) => {
                  const tone = getRenewalTone(doc);
                  return (
                    <div
                      key={getDocumentRecordKey(doc)}
                      onClick={() => onSelectDocument(doc)}
                      className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-xs hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/20 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[#1a4d2e] bg-[#e8f0eb] px-2 py-0.5 rounded-md">
                          หมดอายุวันที่ {formatThaiDate(doc.expiryDate)}
                        </span>
                        <h5 className="font-extrabold text-sm text-slate-800 mt-2">
                          {doc.licensePlate || doc.chassis}
                        </h5>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {getDocTypeName(doc.docType)} · โครงการ: {doc.project || 'ไม่ระบุ'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:text-right sm:flex-col shrink-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold sm:mb-1.5 ${tone.className}`}>
                          {tone.label}
                        </span>
                        <p className="text-xs font-extrabold text-[#1a4d2e]">{getDaysLabel(doc)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl">
                  <FileText size={32} className="text-slate-200 mb-2" />
                  <p className="text-sm font-bold">ไม่มีกำหนดงานค้างต่ออายุในระบบ</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Legend Footer */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500 shrink-0">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> ต้องต่ออายุ
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" /> ใกล้ถึงรอบต่อ
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-400">
          <AlertTriangle size={13} />
          ปุ่มมุมมองสามารถปรับเปลี่ยนและเลื่อนหาข้อมูลปีปฏิทินที่ต้องการได้อิสระ
        </span>
      </div>
    </section>
  );
}
