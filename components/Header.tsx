"use client";

import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    // w-full: กว้างเต็มหน้าจอ
    // fixed top-0 left-0: ลอยติดขอบบนซ้ายของจอเสมอ
    // z-50: ให้อยู่เลเยอร์บนสุด ทับทุกอย่าง
    <header className="w-full h-[70px] bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 left-0 z-50">
      
      {/* ฝั่งซ้าย: ปุ่มเมนู โลโก้ และชื่อระบบ เรียงติดกัน */}
      <div className="flex items-center">
        {/* ปุ่ม Menu */}
        <Menu className="text-gray-600 cursor-pointer mr-6" size={24} />
        
        {/* โลโก้และชื่อระบบ */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-7 bg-[#1a4d2e] rounded-full flex items-center justify-center text-white font-bold text-[10px]">
            EVT
          </div>
          <span className="text-gray-800 font-bold text-lg tracking-tight">EVT Admin Panel</span>
        </div>
      </div>

      {/* ฝั่งขวา: ข้อมูลผู้ใช้ */}
      <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all">
        <div className="text-right">
          <div className="text-sm font-bold text-gray-800 leading-tight">testuser</div>
          <div className="text-[11px] text-gray-400 font-medium leading-tight">admins</div>
        </div>
        <div className="w-10 h-10 bg-[#1a4d2e] rounded-full flex items-center justify-center border-2 border-gray-100 shadow-sm">
          <ChevronDown size={16} className="text-white" />
        </div>
      </div>

    </header>
  );
}