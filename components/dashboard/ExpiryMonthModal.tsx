"use client";

import React from 'react';
import { CalendarDays, X } from 'lucide-react';
import type { ExpiryMonthGroup, VehicleDocument } from '@/types';
import { formatThaiDate, getDocTypeName, getDocumentRecordKey } from '@/utils/documentUtils';

interface ExpiryMonthModalProps {
  month: ExpiryMonthGroup;
  onClose: () => void;
  onSelectDocument: (document: VehicleDocument) => void;
}

export default function ExpiryMonthModal({ month, onClose, onSelectDocument }: ExpiryMonthModalProps) {
  // แสดงเอกสารที่อยู่ในเดือนเดียวกับแท่งกราฟที่ผู้ใช้คลิก และเปิด detail modal ได้จากแต่ละแถว
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-[#e8f0eb]/80">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-full text-[#1a4d2e] shadow-sm">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">เอกสารหมดอายุเดือน {month.name}</h3>
              <p className="text-xs text-gray-500">{month.docs.length} รายการ</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
          {month.docs.length > 0 ? (
            month.docs.map((document) => (
              <button
                type="button"
                key={getDocumentRecordKey(document)}
                onClick={() => onSelectDocument(document)}
                className="w-full text-left bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]/30"
              >
                <div>
                  <p className="text-sm text-slate-800 font-bold">{document.licensePlate ? 'รถทะเบียน' : 'เลขตัวถัง'} {document.licensePlate || document.chassis}</p>
                  <p className="text-sm text-slate-600 font-medium mt-0.5">{getDocTypeName(document.docType)} หมดอายุ</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} className="text-slate-400" />
                      สิ้นสุด: {formatThaiDate(document.expiryDate)}
                    </span>
                    {document.driverName && <span>ผู้รับผิดชอบ: {document.driverName}</span>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่มีเอกสารหมดอายุในเดือนนี้</div>
          )}
        </div>

        <div className="p-4 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-colors text-sm shadow-sm"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
