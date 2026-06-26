"use client";

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Loader2, Search, X, Download, FilePlus, Edit, Trash2, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import type { VehicleDocumentHistoryRecord, VehicleDocumentHistoryEvent } from '@/types';
import { formatThaiDateTime, getDocTypeName, parseDocumentDate } from '@/utils/documentUtils';
import { listAllVehicleDocumentHistoryRecords } from '@/utils/vehicleDocumentApi';
import { captureHandledError } from '@/utils/sentry';

interface HistoryModalProps {
  onClose: () => void;
}

type TimingFilter = 'ALL' | VehicleDocumentHistoryEvent;

const getRenewalDelayDays = (record: VehicleDocumentHistoryRecord) => {
  const previousExpiryDate = parseDocumentDate(record.previousExpiryDate);
  const renewedAt = new Date(record.eventAt);
  if (!previousExpiryDate || Number.isNaN(renewedAt.getTime())) return null;

  const renewalDate = new Date(renewedAt.getFullYear(), renewedAt.getMonth(), renewedAt.getDate());
  const expiryDate = new Date(previousExpiryDate.getFullYear(), previousExpiryDate.getMonth(), previousExpiryDate.getDate());
  return Math.round((renewalDate.getTime() - expiryDate.getTime()) / 86_400_000);
};

const getEventBadge = (record: VehicleDocumentHistoryRecord) => {
  switch (record.eventType) {
    case 'renewed':
      return { label: 'ต่ออายุ', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', Icon: CalendarCheck2 };
    case 'downloaded':
      return { label: 'ดาวน์โหลด', className: 'bg-blue-50 text-blue-700 border-blue-100', Icon: Download };
    case 'created':
      return { label: 'สร้าง', className: 'bg-purple-50 text-purple-700 border-purple-100', Icon: FilePlus };
    case 'updated':
      return { label: 'อัปเดต', className: 'bg-amber-50 text-amber-700 border-amber-100', Icon: Edit };
    case 'deleted':
      return { label: 'ลบ', className: 'bg-red-50 text-red-700 border-red-100', Icon: Trash2 };
    case 'acknowledged':
      return { label: 'รับทราบ', className: 'bg-slate-50 text-slate-700 border-slate-100', Icon: CheckCircle };
    default:
      return { label: record.eventType, className: 'bg-gray-50 text-gray-700 border-gray-100', Icon: Clock };
  }
};

const getEventDetails = (record: VehicleDocumentHistoryRecord) => {
  if (record.eventType === 'renewed') {
    const delayDays = getRenewalDelayDays(record);
    if (delayDays === null) return 'ตรวจสอบวันที่ไม่ได้';
    if (delayDays > 0) return <span className="text-red-600 font-semibold">ต่อหลังหมดอายุ {delayDays} วัน</span>;
    if (delayDays === 0) return <span className="text-orange-600 font-semibold">ต่อในวันหมดอายุ</span>;
    return <span className="text-emerald-600 font-semibold">ต่อก่อนหมดอายุ {Math.abs(delayDays)} วัน</span>;
  }
  if (record.eventType === 'downloaded' && record.details?.filename) {
    return <span className="text-blue-600 font-medium" title={record.details.filename as string}>{record.details.filename as string}</span>;
  }
  return '-';
};

export default function HistoryModal({ onClose }: HistoryModalProps) {
  const [records, setRecords] = useState<VehicleDocumentHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timingFilter, setTimingFilter] = useState<TimingFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    async function loadHistory() {
      try {
        const history = await listAllVehicleDocumentHistoryRecords(undefined, abortController.signal);
        if (!abortController.signal.aborted) setRecords(history);
      } catch (error) {
        captureHandledError(error, { operation: 'history.load' });
        if (!abortController.signal.aborted) setError('โหลดประวัติจาก Neon ไม่สำเร็จ');
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadHistory();
    return () => {
      abortController.abort();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const summary = useMemo(() => {
    let renewed = 0;
    let downloaded = 0;

    records.forEach((record) => {
      if (record.eventType === 'renewed') renewed += 1;
      if (record.eventType === 'downloaded') downloaded += 1;
    });

    return { total: records.length, renewed, downloaded };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('th');

    return records.filter((record) => {
      if (timingFilter !== 'ALL' && record.eventType !== timingFilter) return false;
      if (!normalizedQuery) return true;

      return [
        record.licensePlate,
        record.chassis,
        record.project,
        record.actor,
        getDocTypeName(record.docType),
        record.details?.filename as string,
      ].some((value) => typeof value === 'string' && value.toLocaleLowerCase('th').includes(normalizedQuery));
    });
  }, [records, searchQuery, timingFilter]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0eb] text-[#1a4d2e]">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="history-title" className="text-lg font-bold text-slate-900 sm:text-xl">ประวัติ</h2>
              <p className="text-xs text-slate-500 sm:text-sm">กิจกรรมทั้งหมดในระบบ (ต่ออายุ, ดาวน์โหลด, อัปเดต)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างประวัติ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-slate-50/70">
          <div className="border-r border-slate-200 px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold text-slate-500">กิจกรรมทั้งหมด</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{summary.total}</p>
          </div>
          <div className="border-r border-slate-200 px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold text-emerald-700">ต่ออายุเอกสาร</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700">{summary.renewed}</p>
          </div>
          <div className="px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold text-blue-700">ดาวน์โหลดเอกสาร</p>
            <p className="mt-1 text-xl font-extrabold text-blue-700">{summary.downloaded}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">ค้นหาประวัติ</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ค้นหาทะเบียน โครงการ ชื่อไฟล์ หรือผู้ทำ..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1a4d2e] focus:ring-2 focus:ring-[#1a4d2e]/10"
            />
          </label>
          <div className="relative shrink-0">
            <span className="sr-only">กรองตามประเภทกิจกรรม</span>
            <select
              value={timingFilter}
              onChange={(event) => setTimingFilter(event.target.value as TimingFilter)}
              className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#1a4d2e] focus:ring-2 focus:ring-[#1a4d2e]/10 sm:w-52"
            >
              <option value="ALL">ทุกกิจกรรม</option>
              <option value="renewed">ต่ออายุ</option>
              <option value="downloaded">ดาวน์โหลด</option>
              <option value="created">สร้างเอกสาร</option>
              <option value="updated">อัปเดตข้อมูล</option>
              <option value="deleted">ลบเอกสาร</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2 className="animate-spin" size={20} /> กำลังโหลดประวัติ...
            </div>
          ) : error ? (
            <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Clock className="mb-3 text-slate-300" size={34} />
              <p className="font-bold text-slate-700">{records.length === 0 ? 'ยังไม่มีประวัติในระบบ' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}</p>
              <p className="mt-1 max-w-lg text-sm text-slate-500">
                ลองเปลี่ยนคำค้นหาหรือตัวกรองประเภทกิจกรรม
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[28%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3">เวลา</th>
                  <th className="px-4 py-3">รถ / เอกสาร</th>
                  <th className="px-4 py-3">โครงการ</th>
                  <th className="px-4 py-3">กิจกรรม</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                  <th className="px-4 py-3">ผู้ทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                {filteredRecords.map((record) => {
                  const badge = getEventBadge(record);
                  const Icon = badge.Icon;
                  return (
                    <tr key={record.id} className="align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-600">{formatThaiDateTime(record.eventAt)}</td>
                      <td className="px-4 py-3">
                        <p className="truncate font-bold text-slate-800" title={record.licensePlate || record.chassis}>{record.licensePlate || record.chassis}</p>
                        <p className="mt-1 truncate text-xs text-slate-500" title={`${getDocTypeName(record.docType)} · ${record.chassis}`}>{getDocTypeName(record.docType)} · {record.chassis}</p>
                      </td>
                      <td className="px-4 py-3"><p className="line-clamp-2" title={record.project || 'ไม่ระบุ'}>{record.project || 'ไม่ระบุ'}</p></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${badge.className}`}>
                          <Icon size={12} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 break-words">{getEventDetails(record)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{record.actor || 'system'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 sm:px-6">
          <span>แสดง {filteredRecords.length} จาก {records.length} รายการ</span>
          <span className="hidden sm:inline">เริ่มสะสมจากวันที่เปิดใช้ระบบประวัติ</span>
        </div>
      </div>
    </div>
  );
}
