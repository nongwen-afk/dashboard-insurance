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
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
        <p className="text-xs font-medium text-gray-400 mt-1">{caption}</p>
      </div>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconClassName}`}>
        {icon}
      </div>
    </div>
  );
}
