"use client";

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Loader2, Search, X } from 'lucide-react';
import type { VehicleDocumentHistoryRecord } from '@/types';
import { formatThaiDate, formatThaiDateTime, getDocTypeName, parseDocumentDate } from '@/utils/documentUtils';
import { listVehicleDocumentRenewalHistoryRecords } from '@/utils/vehicleDocumentApi';

interface RenewalHistoryModalProps {
  onClose: () => void;
}

type TimingFilter = 'ALL' | 'ON_TIME' | 'LATE';

const getRenewalDelayDays = (record: VehicleDocumentHistoryRecord) => {
  const previousExpiryDate = parseDocumentDate(record.previousExpiryDate);
  const renewedAt = new Date(record.eventAt);
  if (!previousExpiryDate || Number.isNaN(renewedAt.getTime())) return null;

  const renewalDate = new Date(renewedAt.getFullYear(), renewedAt.getMonth(), renewedAt.getDate());
  const expiryDate = new Date(previousExpiryDate.getFullYear(), previousExpiryDate.getMonth(), previousExpiryDate.getDate());
  return Math.round((renewalDate.getTime() - expiryDate.getTime()) / 86_400_000);
};

const getRenewalTiming = (record: VehicleDocumentHistoryRecord) => {
  const delayDays = getRenewalDelayDays(record);

  if (delayDays === null) {
    return { label: 'ตรวจสอบวันที่ไม่ได้', className: 'bg-slate-100 text-slate-600' };
  }
  if (delayDays > 0) {
    return { label: `ต่อหลังหมดอายุ ${delayDays} วัน`, className: 'bg-red-50 text-red-700' };
  }
  if (delayDays === 0) {
    return { label: 'ต่อในวันหมดอายุ', className: 'bg-orange-50 text-orange-700' };
  }

  return { label: `ต่อก่อนหมดอายุ ${Math.abs(delayDays)} วัน`, className: 'bg-emerald-50 text-emerald-700' };
};

export default function RenewalHistoryModal({ onClose }: RenewalHistoryModalProps) {
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

    async function loadRenewals() {
      try {
        const renewals = await listVehicleDocumentRenewalHistoryRecords(abortController.signal);
        if (!abortController.signal.aborted) setRecords(renewals);
      } catch {
        if (!abortController.signal.aborted) setError('โหลดประวัติการต่ออายุจาก Neon ไม่สำเร็จ');
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadRenewals();
    return () => {
      abortController.abort();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const summary = useMemo(() => {
    let onTime = 0;
    let late = 0;

    records.forEach((record) => {
      const delayDays = getRenewalDelayDays(record);
      if (delayDays === null) return;
      if (delayDays > 0) late += 1;
      else onTime += 1;
    });

    return { total: records.length, onTime, late };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('th');

    return records.filter((record) => {
      const delayDays = getRenewalDelayDays(record);
      if (timingFilter === 'LATE' && (delayDays === null || delayDays <= 0)) return false;
      if (timingFilter === 'ON_TIME' && (delayDays === null || delayDays > 0)) return false;
      if (!normalizedQuery) return true;

      return [
        record.licensePlate,
        record.chassis,
        record.project,
        record.actor,
        getDocTypeName(record.docType),
      ].some((value) => value?.toLocaleLowerCase('th').includes(normalizedQuery));
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
        aria-labelledby="renewal-history-title"
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0eb] text-[#1a4d2e]">
              <CalendarCheck2 size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="renewal-history-title" className="text-lg font-bold text-slate-900 sm:text-xl">ประวัติการต่ออายุ</h2>
              <p className="text-xs text-slate-500 sm:text-sm">เอกสารที่ต่อสำเร็จ พร้อมเปรียบเทียบกำหนดเดิมและกำหนดใหม่</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดประวัติการต่ออายุ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-slate-50/70">
          <div className="border-r border-slate-200 px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold text-slate-500">ต่อสำเร็จทั้งหมด</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{summary.total}</p>
          </div>
          <div className="border-r border-slate-200 px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold text-emerald-700">ต่อทันเวลา</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700">{summary.onTime}</p>
          </div>
          <div className="px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold text-red-700">ต่อหลังหมดอายุ</p>
            <p className="mt-1 text-xl font-extrabold text-red-700">{summary.late}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">ค้นหาประวัติการต่ออายุ</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ค้นหาทะเบียน เลขตัวถัง โครงการ หรือผู้ทำ..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#1a4d2e] focus:ring-2 focus:ring-[#1a4d2e]/10"
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">กรองตามเวลาต่ออายุ</span>
            <select
              value={timingFilter}
              onChange={(event) => setTimingFilter(event.target.value as TimingFilter)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#1a4d2e] focus:ring-2 focus:ring-[#1a4d2e]/10 sm:w-52"
            >
              <option value="ALL">ทุกการต่ออายุ</option>
              <option value="ON_TIME">ต่อทันเวลา</option>
              <option value="LATE">ต่อหลังหมดอายุ</option>
            </select>
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2 className="animate-spin" size={20} /> กำลังโหลดประวัติการต่ออายุ...
            </div>
          ) : error ? (
            <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <CalendarCheck2 className="mb-3 text-slate-300" size={34} />
              <p className="font-bold text-slate-700">{records.length === 0 ? 'ยังไม่มีประวัติการต่ออายุ' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}</p>
              <p className="mt-1 max-w-lg text-sm text-slate-500">
                {records.length === 0
                  ? 'ประวัติจะเริ่มแสดงเมื่อระบบบันทึกการต่ออายุสำเร็จ โดยเก็บวันหมดอายุเดิมและวันหมดอายุใหม่ไว้เปรียบเทียบ'
                  : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองเวลาต่ออายุ'}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[17%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[17%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ต่อสำเร็จเมื่อ</th>
                  <th className="px-4 py-3">รถ / เอกสาร</th>
                  <th className="px-4 py-3">โครงการ</th>
                  <th className="px-4 py-3">หมดอายุเดิม</th>
                  <th className="px-4 py-3">หมดอายุใหม่</th>
                  <th className="px-4 py-3">ผลการต่อ</th>
                  <th className="px-4 py-3">ผู้ทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                {filteredRecords.map((record) => {
                  const timing = getRenewalTiming(record);
                  return (
                    <tr key={record.id} className="align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-600">{formatThaiDateTime(record.eventAt)}</td>
                      <td className="px-4 py-3">
                        <p className="truncate font-bold text-slate-800" title={record.licensePlate || record.chassis}>{record.licensePlate || record.chassis}</p>
                        <p className="mt-1 truncate text-xs text-slate-500" title={`${getDocTypeName(record.docType)} · ${record.chassis}`}>{getDocTypeName(record.docType)} · {record.chassis}</p>
                      </td>
                      <td className="px-4 py-3"><p className="line-clamp-2" title={record.project || 'ไม่ระบุ'}>{record.project || 'ไม่ระบุ'}</p></td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{formatThaiDate(record.previousExpiryDate)}</td>
                      <td className="px-4 py-3 font-bold text-[#1a4d2e]">{formatThaiDate(record.nextExpiryDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${timing.className}`}>{timing.label}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{record.actor || 'system'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 sm:px-6">
          <span>แสดง {filteredRecords.length} จาก {records.length} รายการต่ออายุ</span>
          <span className="hidden sm:inline">เริ่มสะสมจากวันที่เปิดใช้ระบบประวัติ</span>
        </div>
      </div>
    </div>
  );
}
