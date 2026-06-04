"use client";

import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  return (
    // Header อยู่ fixed ด้านบน และส่งคำสั่ง toggle sidebar กลับไปให้ layout จัด state กลาง
    <header className="h-[70px] w-full bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 left-0 z-50">
      
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="p-2 -ml-2 mr-4 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
          title="ย่อ/ขยาย เมนู"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-7 bg-[#1a4d2e] rounded-full flex items-center justify-center text-white font-bold text-[10px]">
            EVT
          </div>
          <span className="text-gray-800 font-bold text-lg tracking-tight">EVT Admin Panel</span>
        </div>
      </div>

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
