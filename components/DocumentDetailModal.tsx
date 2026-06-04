"use client";

import { Building2, CalendarDays, Car, FileText, User, X } from 'lucide-react';
import type { VehicleDocument } from '@/types';
import { formatThaiDate, getDocTypeName } from '@/utils/documentUtils';

interface DocumentDetailModalProps {
  document: VehicleDocument | null;
  onClose: () => void;
}

export default function DocumentDetailModal({ document, onClose }: DocumentDetailModalProps) {
  // ใช้ document null เป็นสัญญาณปิด modal เพื่อให้ caller ไม่ต้องมี state boolean แยกอีกตัว
  if (!document) return null;

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
              <h3 className="font-bold text-gray-800 text-lg">รายละเอียดข้อมูลเอกสาร</h3>
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
                <p className="text-xs text-gray-500 mb-1">โครงการ / Project</p>
                <p className="font-medium text-gray-700">{document.project || 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
              <CalendarDays size={16} /> ข้อมูลเอกสารและความคุ้มครอง
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 px-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">วันที่มีผล (Issued Date)</p>
                <p className="font-medium text-gray-800">{formatThaiDate(document.issuedDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">วันหมดอายุ (Expiry Date)</p>
                <p className="font-medium text-gray-800">{formatThaiDate(document.expiryDate)}</p>
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

        <div className="px-6 pt-5 pb-8 border-t bg-gray-50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-w-24 h-11 px-6 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-bold transition-all shadow-sm shrink-0"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
