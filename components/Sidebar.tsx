"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, Building2, Bus, Route, 
  Users2, Wrench, ChevronDown, LogOut 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  // เก็บเมนูย่อยที่กำลังเปิด เพื่อให้ navigation ฝั่งซ้ายขยายได้ทีละหมวด
  const [openMenu, setOpenMenu] = useState<string | null>('vehicle');

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    // translate-x ใช้ซ่อน sidebar โดยไม่ unmount ทำให้สถานะเมนูย่อยยังอยู่ครบเมื่อเปิดกลับมา
    <aside 
      className={`bg-white border-r border-gray-200 fixed left-0 top-[70px] h-[calc(100vh-70px)] flex flex-col z-40 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-[280px] translate-x-0 opacity-100' : 'w-[280px] -translate-x-full opacity-0 pointer-events-none'}
      `}
    >
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
        
        <Link href="/" className="flex items-center gap-4 px-3 py-3 text-slate-700 font-semibold hover:bg-emerald-50/30 hover:text-[#1a4d2e] rounded-xl transition-all">
          <BarChart3 size={22} strokeWidth={2} className="text-slate-500 group-hover:text-[#1a4d2e]" />
          <span>แดชบอร์ด</span>
        </Link>

        <Link href="#" className="flex items-center gap-4 px-3 py-3 text-slate-700 font-semibold hover:bg-emerald-50/30 hover:text-[#1a4d2e] rounded-xl transition-all">
          <Building2 size={22} strokeWidth={2} className="text-slate-500" />
          <span>โครงการ</span>
        </Link>

        <div className="space-y-1">
          <button 
            onClick={() => toggleMenu('vehicle')}
            className="w-full flex items-center justify-between px-3 py-3 text-slate-700 font-semibold hover:bg-emerald-50/30 hover:text-[#1a4d2e] rounded-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <Bus size={22} strokeWidth={2} className="text-slate-500" />
              <span>ยานพาหนะ</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${openMenu === 'vehicle' ? 'rotate-180 text-[#1a4d2e]' : 'text-slate-400'}`} />
          </button>
          
          {openMenu === 'vehicle' && (
            <div className="ml-10 pl-2 border-l border-emerald-100 space-y-1 my-1">
              <Link href="#" className="block py-2 px-3 text-sm text-slate-600 hover:text-[#1a4d2e] hover:bg-emerald-50/20 rounded-lg transition-colors">ยานพาหนะ</Link>
              <Link href="#" className="block py-2 px-3 text-sm text-slate-600 hover:text-[#1a4d2e] hover:bg-emerald-50/20 rounded-lg transition-colors">รุ่นยานพาหนะ</Link>
              <Link href="/" className="block py-2 px-4 text-sm text-white bg-gradient-to-r from-emerald-800 to-[#1a4d2e] rounded-lg font-bold shadow-sm shadow-[#1a4d2e]/20 transition-all transform scale-[1.01]">เอกสารยานพาหนะ</Link>
              <Link href="#" className="block py-2 px-3 text-sm text-slate-600 hover:text-[#1a4d2e] hover:bg-emerald-50/20 rounded-lg transition-colors">ผู้ให้บริการ GPS</Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-3 text-slate-700 font-semibold hover:bg-emerald-50/30 hover:text-[#1a4d2e] rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-4">
            <Route size={22} strokeWidth={2} className="text-slate-500" />
            <span>การเดินรถ</span>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>

        <div className="flex items-center justify-between px-3 py-3 text-slate-700 font-semibold hover:bg-emerald-50/30 hover:text-[#1a4d2e] rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-4">
            <Users2 size={22} strokeWidth={2} className="text-slate-500" />
            <span>คนขับรถ</span>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>

        <div className="flex items-center justify-between px-3 py-3 text-slate-700 font-semibold hover:bg-emerald-50/30 hover:text-[#1a4d2e] rounded-xl cursor-pointer transition-all border-t border-slate-100 pt-4 mt-2">
          <div className="flex items-center gap-4">
            <Wrench size={22} strokeWidth={2} className="text-slate-500" />
            <span>ซ่อมบำรุง</span>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 text-slate-400 hover:text-red-500 transition-colors px-3 py-2 w-full cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">ย่อเมนู</span>
        </button>
      </div>
    </aside>
  );
}
