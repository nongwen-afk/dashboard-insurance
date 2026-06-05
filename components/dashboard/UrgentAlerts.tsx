"use client";

import React from 'react';
import { BellRing, CalendarDays, CheckCircle2 } from 'lucide-react';
import type { DocumentAlert, VehicleDocument } from '@/types';

interface UrgentAlertsProps {
  alerts: DocumentAlert[];
  onOpenAll: () => void;
  onSelectDocument: (document: VehicleDocument) => void;
}

export default function UrgentAlerts({ alerts, onOpenAll, onSelectDocument }: UrgentAlertsProps) {
  // แสดงเฉพาะรายการด่วนบนหน้าแรก และให้แต่ละรายการเปิด detail modal จาก document ต้นทาง
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <div className="bg-red-100 p-2 rounded-full">
          <BellRing size={18} className="text-red-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">แจ้งเตือน(ด่วน)</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[250px] custom-scrollbar">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const isExpired = alert.type === 'error';
            return (
              <button
                type="button"
                key={alert.id}
                onClick={() => onSelectDocument(alert.doc)}
                className={`w-full text-left p-3 rounded-xl border ${isExpired ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'} transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]/30`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-800 line-clamp-1 flex-1 pr-2">{alert.text.split(' - ')[0]}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${isExpired ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isExpired ? 'หมดอายุแล้ว' : 'ใกล้หมด'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 text-xs mt-2 font-medium">
                  <span className="line-clamp-1">
                    {alert.text.split(' - ')[1]}
                    <span className={`ml-1 font-bold ${isExpired ? 'text-red-500' : 'text-orange-500'}`}>
                      {alert.daysText}
                    </span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <CalendarDays size={12} className={isExpired ? 'text-red-400' : 'text-orange-400'} />
                    <span>{alert.date}</span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-8">
            <CheckCircle2 size={32} className="text-green-400 opacity-50" />
            <p className="text-sm font-medium">เยี่ยมมาก! ไม่มีรายการค้าง</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={onOpenAll}
          className="w-full text-center text-sm font-bold text-[#1a4d2e] hover:text-[#123620] hover:underline transition-colors py-1"
        >
          ดูการแจ้งเตือนทั้งหมด
        </button>
      </div>
    </div>
  );
}
