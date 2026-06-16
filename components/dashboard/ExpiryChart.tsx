"use client";

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import type { ExpiryMonthGroup, VehicleDocument } from '@/types';
import { formatDateOnly, formatThaiDate, getDaysUntilExpiry, getDocTypeName, getDocumentRecordKey, parseDocumentDate } from '@/utils/documentUtils';

interface ChartMonth extends ExpiryMonthGroup {
  value: number;
}

interface ExpiryChartProps {
  chartData: ChartMonth[];
  onSelectDocument: (document: VehicleDocument) => void;
}

const THAI_MONTHS_FULL = [
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

const getMonthLabel = (date: Date) => `${THAI_MONTHS_FULL[date.getMonth()]} ${date.getFullYear() + 543}`;

const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getCalendarStart = (month: Date) => {
  const firstDay = getStartOfMonth(month);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  return new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - mondayOffset);
};

const getRenewalTone = (document: VehicleDocument) => {
  if (document.isAcknowledged) {
    return {
      label: 'ยังไม่ต่อ',
      className: 'border-red-100 bg-red-50/70 text-red-700',
      dotClassName: 'bg-red-500',
    };
  }

  const days = getDaysUntilExpiry(document.expiryDate);
  if (days < 0) {
    return {
      label: 'ยังไม่ต่อ',
      className: 'border-red-100 bg-red-50/70 text-red-700',
      dotClassName: 'bg-red-500',
    };
  }

  if (days <= 30) {
    return {
      label: 'ใกล้ถึงรอบต่อ',
      className: 'border-orange-100 bg-orange-50/70 text-orange-700',
      dotClassName: 'bg-orange-500',
    };
  }

  return {
    label: 'ต่อแล้ว',
    className: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  };
};

const getDaysLabel = (document: VehicleDocument) => {
  if (document.isAcknowledged) return 'ยังไม่พบข้อมูลต่ออายุสำเร็จ';

  const days = getDaysUntilExpiry(document.expiryDate);
  if (days < 0) return `เลยกำหนด ${Math.abs(days)} วัน`;
  if (days === 0) return 'ถึงรอบวันนี้';
  return `เหลืออีก ${days} วัน`;
};

export default function ExpiryChart({ chartData, onSelectDocument }: ExpiryChartProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => getStartOfMonth(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const scheduleDocs = useMemo(() => {
    return chartData
      .flatMap((month) => month.docs)
      .filter((document) => parseDocumentDate(document.expiryDate))
      .sort((a, b) => {
        const dateA = parseDocumentDate(a.expiryDate)?.getTime() || 0;
        const dateB = parseDocumentDate(b.expiryDate)?.getTime() || 0;
        return dateA - dateB;
      });
  }, [chartData]);

  const docsByDay = useMemo(() => {
    const map = new Map<string, VehicleDocument[]>();

    scheduleDocs.forEach((document) => {
      const expiryDate = parseDocumentDate(document.expiryDate);
      if (!expiryDate) return;

      const key = formatDateOnly(expiryDate);
      const existing = map.get(key) || [];
      existing.push(document);
      map.set(key, existing);
    });

    return map;
  }, [scheduleDocs]);

  const calendarDays = useMemo(() => {
    const start = getCalendarStart(visibleMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = formatDateOnly(date);
      return {
        date,
        key,
        docs: docsByDay.get(key) || [],
        isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      };
    });
  }, [docsByDay, visibleMonth]);

  const firstBusyDayKey = calendarDays.find((day) => day.docs.length > 0)?.key || null;
  const activeDayKey = selectedDayKey || firstBusyDayKey || formatDateOnly(visibleMonth);
  const activeDay = calendarDays.find((day) => day.key === activeDayKey);
  const activeDocs = activeDay?.docs || [];

  const monthDocs = calendarDays
    .filter((day) => day.isCurrentMonth)
    .flatMap((day) => day.docs);

  const overdueCount = monthDocs.filter((document) => document.isAcknowledged || getDaysUntilExpiry(document.expiryDate) < 0).length;
  const nextSevenDaysCount = monthDocs.filter((document) => {
    if (document.isAcknowledged) return false;
    const days = getDaysUntilExpiry(document.expiryDate);
    return days >= 0 && days <= 7;
  }).length;
  const nextThirtyDaysCount = monthDocs.filter((document) => {
    if (document.isAcknowledged) return false;
    const days = getDaysUntilExpiry(document.expiryDate);
    return days > 7 && days <= 30;
  }).length;

  const handleMonthChange = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDayKey(null);
  };

  return (
    <section className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">ปฏิทินต่ออายุ</h3>
          <p className="text-sm text-gray-500">รายการตามวันหมดอายุในช่วง 6 เดือนข้างหน้า</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMonthChange(-1)}
            className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-36 text-center text-sm font-bold text-slate-700">
            {getMonthLabel(visibleMonth)}
          </div>
          <button
            type="button"
            onClick={() => handleMonthChange(1)}
            className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2">
          <p className="text-[11px] font-bold text-red-600">ยังไม่ต่อ</p>
          <p className="text-xl font-extrabold text-red-700">{overdueCount}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2">
          <p className="text-[11px] font-bold text-orange-600">7 วัน</p>
          <p className="text-xl font-extrabold text-orange-700">{nextSevenDaysCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
          <p className="text-[11px] font-bold text-emerald-700">8-30 วัน</p>
          <p className="text-xl font-extrabold text-emerald-800">{nextThirtyDaysCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 min-h-[360px]">
        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-[11px] font-bold text-slate-400">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const isSelected = day.key === activeDayKey;
              const hasDocs = day.docs.length > 0;
              const hasOverdue = day.docs.some((document) => document.isAcknowledged || getDaysUntilExpiry(document.expiryDate) < 0);
              const hasWarning = day.docs.some((document) => {
                if (document.isAcknowledged) return false;
                const days = getDaysUntilExpiry(document.expiryDate);
                return days >= 0 && days <= 30;
              });

              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => setSelectedDayKey(day.key)}
                  className={`aspect-square min-h-11 rounded-xl border p-1.5 text-left transition-all ${
                    isSelected
                      ? 'border-[#1a4d2e] bg-[#e8f0eb] shadow-sm'
                      : day.isCurrentMonth
                        ? 'border-slate-100 bg-white hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/30'
                        : 'border-slate-50 bg-slate-50/60 text-slate-300'
                  }`}
                  aria-label={`${formatThaiDate(day.key)} ${day.docs.length} รายการ`}
                >
                  <span className={`block text-xs font-bold ${day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                    {day.date.getDate()}
                  </span>
                  {hasDocs && (
                    <span className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      hasOverdue
                        ? 'bg-red-100 text-red-700'
                        : hasWarning
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {day.docs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400">วันที่เลือก</p>
              <h4 className="text-base font-extrabold text-slate-800">
                {activeDay ? formatThaiDate(activeDay.key) : '-'}
              </h4>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white text-[#1a4d2e] border border-slate-100 flex items-center justify-center shadow-xs">
              <CalendarDays size={18} />
            </div>
          </div>

          <div className="space-y-2 max-h-[292px] overflow-y-auto pr-1 custom-scrollbar">
            {activeDocs.length > 0 ? (
              activeDocs.map((document) => {
                const tone = getRenewalTone(document);
                return (
                  <button
                    type="button"
                    key={getDocumentRecordKey(document)}
                    onClick={() => onSelectDocument(document)}
                    className="w-full rounded-xl border border-white bg-white p-3 text-left shadow-xs transition-all hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/30 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-800 truncate">
                          {document.licensePlate || document.chassis}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate">
                          {getDocTypeName(document.docType)} · {document.project || 'ไม่ระบุโครงการ'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${tone.className}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {getDaysLabel(document)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${tone.dotClassName}`} />
                        {formatThaiDate(document.expiryDate)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-slate-400">
                <FileText size={28} className="mb-2 text-slate-300" />
                <p className="text-sm font-bold">ไม่มีรายการในวันนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> ยังไม่ต่อ</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> ใกล้ถึงรอบต่อ</span>
        <span className="inline-flex items-center gap-1"><AlertTriangle size={13} className="text-slate-400" /> จำนวนบนวันคือจำนวนเอกสาร</span>
      </div>
    </section>
  );
}
