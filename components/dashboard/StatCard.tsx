"use client";

import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  iconClassName: string;
}

export default function StatCard({ title, value, caption, icon, iconClassName }: StatCardProps) {
  // Card กลางสำหรับตัวเลขสรุป ทำให้ dashboard เปลี่ยนข้อความ/icon ได้โดยไม่ซ้ำ markup เดิม 4 รอบ
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</h3>
        <p className="text-[10px] sm:text-xs font-medium text-gray-400 mt-1">{caption}</p>
      </div>
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 ${iconClassName}`}>
        <div className="scale-85 sm:scale-100">
          {icon}
        </div>
      </div>
    </div>
  );
}
