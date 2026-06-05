"use client";

import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  return (
    // Header อยู่ fixed ด้านบน และส่งคำสั่ง toggle sidebar กลับไปให้ layout จัด state กลาง
    <header className="h-[70px] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 fixed top-0 left-0 z-50">
      
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="p-2 -ml-2 mr-2 sm:mr-4 text-slate-600 cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
          title="ย่อ/ขยาย เมนู"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2.5 py-1 bg-gradient-to-r from-emerald-800 to-[#1a4d2e] rounded-lg flex items-center justify-center text-white font-black text-[10px] sm:text-xs tracking-wider shrink-0 shadow-sm shadow-emerald-800/10">
            EVT
          </div>
          <span className="text-slate-800 font-bold text-sm sm:text-base tracking-tight whitespace-nowrap">EVT Admin Panel</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-slate-50/80 p-1.5 sm:py-1.5 sm:px-3 rounded-xl border border-transparent hover:border-slate-100 transition-all">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-slate-800 leading-tight">testuser</div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-tight">admins</div>
        </div>
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center border border-emerald-400/20 shadow-sm shrink-0">
          <span className="text-white text-xs font-black uppercase">TU</span>
        </div>
      </div>

    </header>
  );
}
