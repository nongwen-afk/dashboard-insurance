"use client";

import { useState } from 'react';
import { Building2, CalendarDays, Car, FileText, User, X, AlertTriangle, Clock, CheckCircle2, Info, RefreshCw, History, Loader2 } from 'lucide-react';
import type { VehicleDocument, VehicleDocumentHistoryEvent, VehicleDocumentHistoryRecord } from '@/types';
import { formatThaiDate, formatThaiDateTime, getDocTypeName, getDocumentStatus } from '@/utils/documentUtils';
import { listVehicleDocumentHistoryRecords } from '@/utils/vehicleDocumentApi';

interface DocumentDetailModalProps {
  document: VehicleDocument | null;
  onClose: () => void;
  onAcknowledge?: (document: VehicleDocument) => void;
  onSync?: (document: VehicleDocument) => void;
}

export default function DocumentDetailModal({ document, onClose, onAcknowledge, onSync }: DocumentDetailModalProps) {
  const [historyDocumentId, setHistoryDocumentId] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<VehicleDocumentHistoryRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // ใช้ document null เป็นสัญญาณปิด modal เพื่อให้ caller ไม่ต้องมี state boolean แยกอีกตัว
  if (!document) return null;

  const { status, days } = getDocumentStatus(document.expiryDate);
  const currentHistoryKey = document.id || 'missing-id';
  const isHistoryOpen = historyDocumentId === currentHistoryKey;

  const getHistoryEventDetails = (eventType: VehicleDocumentHistoryEvent) => {
    switch (eventType) {
      case 'created':
        return { label: 'นำเข้าข้อมูล', dotClassName: 'bg-slate-500', textClassName: 'text-slate-700' };
      case 'acknowledged':
        return { label: 'รับทราบแล้ว', dotClassName: 'bg-blue-500', textClassName: 'text-blue-700' };
      case 'renewed':
        return { label: 'ต่อสำเร็จ', dotClassName: 'bg-emerald-500', textClassName: 'text-emerald-700' };
      case 'sync_no_update':
        return { label: 'ซิงค์แล้ว ยังไม่พบรายการต่อ', dotClassName: 'bg-orange-500', textClassName: 'text-orange-700' };
      case 'deleted':
        return { label: 'ลบเอกสาร', dotClassName: 'bg-red-500', textClassName: 'text-red-700' };
      default:
        return { label: 'อัปเดตข้อมูล', dotClassName: 'bg-gray-500', textClassName: 'text-gray-700' };
    }
  };

  const handleToggleHistory = async () => {
    if (!document.id) {
      setHistoryDocumentId(currentHistoryKey);
      setHistoryRecords([]);
      setHistoryError('รายการนี้ยังไม่มีรหัสเอกสาร จึงยังดึงประวัติไม่ได้');
      return;
    }

    if (isHistoryOpen) {
      setHistoryDocumentId(null);
      return;
    }

    setHistoryDocumentId(document.id);
    setHistoryRecords([]);
    setHistoryError(null);
    setIsHistoryLoading(true);

    try {
      const records = await listVehicleDocumentHistoryRecords(document.id);
      setHistoryRecords(records);
    } catch {
      setHistoryError('โหลดประวัติจาก Neon ไม่สำเร็จ');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // กำหนดรูปแบบเนื้อหาแบนเนอร์และป้ายสถานะ
  const getBannerDetails = () => {
    if (document.isAcknowledged) {
      const ackUserText = document.acknowledgedBy || 'ไม่ระบุ';
      const ackDateText = formatThaiDateTime(document.acknowledgedAt);
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: <Info className="text-blue-500 shrink-0" size={20} />,
        title: 'ยังไม่ต่อ',
        description: `บันทึกการตรวจสอบโดย ${ackUserText} เมื่อวันที่ ${ackDateText} แต่ยังไม่พบข้อมูลต่ออายุสำเร็จ`,
        badgeClassName: 'bg-blue-50 text-blue-700 border-blue-100'
      };
    }

    switch (status) {
      case 'EXPIRED':
        return {
          bg: 'bg-red-50 border-red-200 text-red-950',
          icon: <AlertTriangle className="text-red-500 shrink-0 animate-bounce" size={20} />,
          title: 'ยังไม่ต่อ',
          description: `เอกสารหมดอายุเมื่อวันที่ ${formatThaiDate(document.expiryDate)} (เลยกำหนดมาแล้ว ${Math.abs(days)} วัน)`,
          badgeClassName: 'bg-red-50 text-red-700 border-red-100'
        };
      case 'WARNING':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-950',
          icon: <Clock className="text-orange-500 shrink-0" size={20} />,
          title: 'ใกล้ถึงรอบต่อ',
          description: `จะหมดอายุในอีก ${days} วัน กรุณาเตรียมการดำเนินการต่ออายุ`,
          badgeClassName: 'bg-orange-50 text-orange-700 border-orange-100'
        };
      case 'ACTIVE':
        return {
          bg: 'bg-green-50 border-green-200 text-green-950',
          icon: <CheckCircle2 className="text-green-500 shrink-0" size={20} />,
          title: 'ต่อแล้ว',
          description: `เอกสารยังมีผลบังคับใช้ (เหลือเวลาอีก ${days} วัน)`,
          badgeClassName: 'bg-green-50 text-green-700 border-green-100'
        };
      case 'NO_EXPIRY':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          icon: <CheckCircle2 className="text-slate-400 shrink-0" size={20} />,
          title: 'ไม่ต้องต่อ',
          description: 'เอกสารประเภทนี้ไม่มีกำหนดวันหมดอายุ',
          badgeClassName: 'bg-slate-50 text-slate-600 border-slate-200'
        };
    }
  };

  const banner = getBannerDetails();

  const getExpiryHighlightClass = () => {
    if (document.isAcknowledged) {
      return 'p-3 rounded-xl border border-blue-100 bg-blue-50/40 transition-all';
    }
    switch (status) {
      case 'EXPIRED':
        return 'p-3 rounded-xl border border-red-200 bg-red-50/40 transition-all';
      case 'WARNING':
        return 'p-3 rounded-xl border border-orange-200 bg-orange-50/40 transition-all';
      default:
        return 'p-3 rounded-xl border border-gray-100 bg-gray-50/30 transition-all';
    }
  };

  return (
    // z-index สูงกว่ารายการ modal อื่น เพราะ detail modal สามารถเปิดซ้อนจาก alert/month modal ได้
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[9998] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#e8f0eb] p-2.5 rounded-xl text-[#1a4d2e]">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-800 text-lg">รายละเอียดข้อมูลเอกสาร</h3>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${banner.badgeClassName}`}>
                  {banner.title}
                </span>
              </div>
              <p className="text-xs text-gray-500">ประเภท: {getDocTypeName(document.docType)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors border border-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* แบนเนอร์เน้นย้ำสถานะการหมดอายุ */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${banner.bg}`}>
            <div className="mt-0.5">{banner.icon}</div>
            <div className="space-y-0.5">
              <h5 className="font-bold text-sm">{banner.title}</h5>
              <p className="text-xs opacity-90">{banner.description}</p>
            </div>
          </div>

          {isHistoryOpen && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <History size={16} /> สมุดบันทึกประวัติ
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">เหตุการณ์ย้อนหลังของเอกสารใบนี้</p>
                </div>
                {isHistoryLoading && <Loader2 className="animate-spin text-slate-400" size={18} />}
              </div>

              {historyError ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {historyError}
                </p>
              ) : historyRecords.length === 0 && !isHistoryLoading ? (
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-500">
                  ยังไม่มีประวัติของเอกสารใบนี้
                </p>
              ) : (
                <div className="space-y-3">
                  {historyRecords.map((record) => {
                    const event = getHistoryEventDetails(record.eventType);
                    const hasExpiryChange = record.previousExpiryDate !== record.nextExpiryDate;

                    return (
                      <div key={record.id} className="relative rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${event.dotClassName}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className={`text-sm font-bold ${event.textClassName}`}>{event.label}</p>
                              <p className="text-xs font-semibold text-slate-400">{formatThaiDateTime(record.eventAt)}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">โดย {record.actor || 'system'}</p>
                            {hasExpiryChange && (
                              <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                วันหมดอายุ: {formatThaiDate(record.previousExpiryDate)} → {formatThaiDate(record.nextExpiryDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
              <Car size={16} /> ข้อมูลยานพาหนะ
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 border border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">ทะเบียนรถ</p>
                <p className="font-bold text-gray-800 text-base">{document.licensePlate || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">เลขตัวถัง / Chassis</p>
                <p className="font-mono text-gray-700 font-medium">{document.chassis || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">โครงการ / สัญญา (Project)</p>
                <p className="font-medium text-gray-700">{document.project || 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
              <CalendarDays size={16} /> ข้อมูลเอกสารและความคุ้มครอง
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 px-2 items-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">วันที่มีผล (Issued Date)</p>
                <p className="font-medium text-gray-800">{formatThaiDate(document.issuedDate)}</p>
              </div>
              <div className={getExpiryHighlightClass()}>
                <p className="text-xs text-gray-500 mb-1">วันหมดอายุ (Expiry Date)</p>
                <p className="font-bold text-gray-800">{formatThaiDate(document.expiryDate)}</p>
              </div>
              <div className="sm:col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-1">
                      <User size={12} /> ผู้รับผิดชอบ (Driver)
                    </p>
                    <p className="font-medium text-gray-800">{document.driverName || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-1">
                      <Building2 size={12} /> บริษัทประกัน/ผู้ออกเอกสาร
                    </p>
                    <p className="font-medium text-gray-800">{document.issuer || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>
              {document.isAcknowledged && (
                <div className="sm:col-span-2 bg-slate-50/60 p-3 rounded-lg border border-slate-200/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                        <User size={12} /> ผู้รับทราบ (Acknowledged By)
                      </p>
                      <p className="font-medium text-gray-800">{document.acknowledgedBy || 'ไม่ระบุ'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                        <Clock size={12} /> วันที่รับทราบ (Acknowledged At)
                      </p>
                      <p className="font-medium text-gray-800">{formatThaiDateTime(document.acknowledgedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1">หมายเลขเอกสาร/กรมธรรม์</p>
                <p className="font-medium text-gray-800">{document.docNumber || 'ไม่มีข้อมูล'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ไฟล์แนบ</p>
                <p className="font-medium text-gray-800">{document.hasAttachment ? 'มีไฟล์แนบในระบบ' : 'ไม่มีไฟล์แนบ'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                <p className="font-medium text-gray-800">{document.note || 'ไม่มีหมายเหตุ'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-8 border-t bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleHistory}
            className={`h-11 px-5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 border ${
              isHistoryOpen
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <History size={16} />
            {isHistoryOpen ? 'ซ่อนประวัติ' : 'ประวัติ'}
          </button>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {document.isAcknowledged ? (
              onSync && (
                <button
                  type="button"
                  onClick={() => onSync(document)}
                  className="h-11 px-5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
                >
                  <RefreshCw size={16} />
                  ซิงค์ข้อมูลล่าสุด
                </button>
              )
            ) : (
              (status === 'EXPIRED' || status === 'WARNING') && onAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(document)}
                  className="h-11 px-5 text-white bg-[#1a4d2e] hover:bg-[#123620] rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
                >
                  <CheckCircle2 size={16} />
                  รับทราบการแจ้งเตือน
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="min-w-24 h-11 px-6 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-bold transition-all shadow-sm shrink-0"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
