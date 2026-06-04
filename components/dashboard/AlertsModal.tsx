"use client";

import React from 'react';
import { AlertTriangle, CalendarDays, X } from 'lucide-react';
import type { DocumentAlert, VehicleDocument } from '@/types';

interface AlertsModalProps {
  alerts: DocumentAlert[];
  onClose: () => void;
  onSelectDocument: (document: VehicleDocument) => void;
}

export default function AlertsModal({ alerts, onClose, onSelectDocument }: AlertsModalProps) {
  // Modal นี้แสดงรายการแจ้งเตือนทั้งหมด ส่วนการเปิดรายละเอียดส่ง document กลับให้ parent จัดการ
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-red-50/80">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            <h3 className="font-bold text-red-800 text-lg">การแจ้งเตือนทั้งหมด ({alerts.length})</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <button
                type="button"
                key={alert.id}
                onClick={() => onSelectDocument(alert.doc)}
                className="w-full text-left bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:border-red-200 hover:bg-red-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-sm ${alert.type === 'error' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 font-bold">{alert.text.split(' - ')[0]}</p>
                  <p className="text-sm text-slate-600 font-medium mt-0.5">{alert.text.split(' - ')[1]}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <CalendarDays size={14} className="text-slate-400" />
                      สิ้นสุด: {alert.date}
                    </span>
                    <span className={`font-bold ${alert.type === 'error' ? 'text-red-500' : 'text-orange-500'}`}>
                      {alert.daysText}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่มีการแจ้งเตือน</div>
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
