"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Building2, CalendarDays, Car, FileText, User, X, AlertTriangle, Clock, CheckCircle2, Info, RefreshCw, Eye, FileX, Download } from 'lucide-react';
import type { VehicleDocument } from '@/types';
import { getDocumentAttachmentPreview } from '@/utils/documentAttachment';
import { formatThaiDate, formatThaiDateTime, getDocTypeName, getDocumentStatus } from '@/utils/documentUtils';

interface DocumentDetailModalProps {
  document: VehicleDocument | null;
  onClose: () => void;
  onAcknowledge?: (document: VehicleDocument) => void;
  onSync?: (document: VehicleDocument) => void;
}

export default function DocumentDetailModal({ document, onClose, onAcknowledge, onSync }: DocumentDetailModalProps) {
  const [previewDocumentKey, setPreviewDocumentKey] = useState<string | null>(null);

  // ใช้ document null เป็นสัญญาณปิด modal เพื่อให้ caller ไม่ต้องมี state boolean แยกอีกตัว
  if (!document) return null;

  const { status, days } = getDocumentStatus(document.expiryDate);
  const documentKey = document.id || `${document.chassis}-${document.docType}`;
  const attachmentPreview = getDocumentAttachmentPreview(document);
  const isPreviewOpen = previewDocumentKey === documentKey;

  const handleClose = () => {
    setPreviewDocumentKey(null);
    onClose();
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
            onClick={handleClose}
            aria-label="ปิดรายละเอียดเอกสาร"
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
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-2">เอกสารแนบ</p>
                {attachmentPreview ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-[#1a4d2e] shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{attachmentPreview.title}</p>
                        <p className="text-xs text-gray-500">มีเอกสารในระบบ พร้อมเปิดดูภาพตัวอย่าง</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDocumentKey(documentKey)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1a4d2e] px-4 text-sm font-bold text-white transition-colors hover:bg-[#123620]"
                      >
                        <Eye size={16} />
                        ดูตัวอย่างภาพ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-500">
                    <FileX size={18} className="shrink-0 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-600">ไม่มีเอกสาร</p>
                      <p className="text-xs text-gray-400">ยังไม่มีรูปหรือไฟล์แนบสำหรับรายการนี้</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                <p className="font-medium text-gray-800">{document.note || 'ไม่มีหมายเหตุ'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-8 border-t bg-gray-50 flex flex-wrap items-center justify-end gap-3 shrink-0">
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
              onClick={handleClose}
              className="min-w-24 h-11 px-6 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-bold transition-all shadow-sm shrink-0"
            >
              ปิด
            </button>
        </div>
      </div>

      {attachmentPreview && isPreviewOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={attachmentPreview.title}
          onClick={() => setPreviewDocumentKey(null)}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h4 className="font-bold text-gray-800">{attachmentPreview.title}</h4>
                <p className="text-xs text-gray-500">{document.licensePlate || document.chassis}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={attachmentPreview.src}
                  download={`${getDocTypeName(document.docType)}_${document.licensePlate || document.chassis}.jpg`}
                  onClick={() => toast.success(`ดาวน์โหลดรูปภาพ ${getDocTypeName(document.docType)} ของ ${document.licensePlate || document.chassis} เรียบร้อยแล้ว`)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a4d2e] px-3 text-xs font-bold text-white transition-colors hover:bg-[#123620]"
                >
                  <Download size={14} />
                  ดาวน์โหลดรูปภาพ
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocumentKey(null)}
                  aria-label="ปิดรูปเอกสาร"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex max-h-[80vh] items-start justify-center overflow-auto bg-slate-100 p-4 sm:p-6">
              <Image
                src={attachmentPreview.src}
                alt={attachmentPreview.alt}
                width={attachmentPreview.width}
                height={attachmentPreview.height}
                loading="eager"
                sizes="(max-width: 768px) 92vw, 768px"
                className="block h-auto max-h-[76vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
