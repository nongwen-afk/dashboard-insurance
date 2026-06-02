"use client";

import React from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

// จำลองข้อมูลแจ้งเตือน
const alerts = [
  { 
    id: 1, 
    message: 'พ.ร.บ. ทะเบียน 3กง 9012 ขาดต่ออายุแล้ว!', 
    time: '10 นาทีที่แล้ว', 
    icon: ShieldAlert, 
    color: 'text-red-600', 
    bg: 'bg-red-100' 
  },
  { 
    id: 2, 
    message: 'ทะเบียน 2กค 5678 จะหมดอายุใน 13 วัน', 
    time: '2 ชั่วโมงที่แล้ว', 
    icon: AlertTriangle, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-100' 
  },
  { 
    id: 3, 
    message: 'รออนุมัติเบิกจ่ายต่อ พ.ร.บ. ทะเบียน 1กข 1234', 
    time: '1 วันที่แล้ว', 
    icon: Clock, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100' 
  },
];

export default function RecentAlerts() {
  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">การแจ้งเตือนด่วน</h3>
        <button className="text-sm text-blue-600 hover:underline font-medium">ดูทั้งหมด</button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-4">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
              <div className={`p-2 rounded-full ${alert.bg} ${alert.color} shrink-0`}>
                <alert.icon size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium leading-snug">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}