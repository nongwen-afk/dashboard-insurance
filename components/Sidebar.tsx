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
  const [openMenu, setOpenMenu] = useState<string | null>('vehicle');

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    // 📍 ปรับแก้คลาสตรงนี้ เพื่อให้แน่ใจว่าเนื้อหาข้างในไม่หายเวลาสไลด์
    <aside 
      className={`bg-white border-r border-gray-200 fixed left-0 top-[70px] h-[calc(100vh-70px)] flex flex-col z-40 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-[280px] translate-x-0 opacity-100' : 'w-[280px] -translate-x-full opacity-0 pointer-events-none'}
      `}
    >
      
      {/* ส่วนของเมนู ตรงนี้ต้องอยู่ครบเหมือนเดิมครับ */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
        
        <Link href="/" className="flex items-center gap-4 px-3 py-3 text-[#1a4d2e] font-bold hover:bg-gray-50 rounded-xl transition-all">
          <BarChart3 size={24} strokeWidth={2.5} />
          <span>แดชบอร์ด</span>
        </Link>

        <Link href="#" className="flex items-center gap-4 px-3 py-3 text-[#1a4d2e] font-bold hover:bg-gray-50 rounded-xl transition-all">
          <Building2 size={24} strokeWidth={2.5} />
          <span>โครงการ</span>
        </Link>

        <div className="space-y-1">
          <button 
            onClick={() => toggleMenu('vehicle')}
            className={`w-full flex items-center justify-between px-3 py-3 font-bold rounded-xl transition-all ${openMenu === 'vehicle' ? 'text-[#1a4d2e]' : 'text-[#1a4d2e]'}`}
          >
            <div className="flex items-center gap-4">
              <Bus size={24} strokeWidth={2.5} />
              <span>ยานพาหนะ</span>
            </div>
            <ChevronDown size={18} className={`transition-transform ${openMenu === 'vehicle' ? 'rotate-180' : ''}`} />
          </button>
          
          {openMenu === 'vehicle' && (
            <div className="ml-12 space-y-1">
              <Link href="#" className="block py-2 text-sm text-gray-600 hover:text-[#1a4d2e]">ยานพาหนะ</Link>
              <Link href="#" className="block py-2 text-sm text-gray-600 hover:text-[#1a4d2e]">รุ่นยานพาหนะ</Link>
              <Link href="/" className="block py-2 px-4 text-sm text-[#1a4d2e] bg-[#e8f0eb] rounded-lg font-bold">เอกสารยานพาหนะ</Link>
              <Link href="#" className="block py-2 text-sm text-gray-600 hover:text-[#1a4d2e]">ผู้ให้บริการ GPS</Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-3 text-[#1a4d2e] font-bold hover:bg-gray-50 rounded-xl cursor-pointer">
          <div className="flex items-center gap-4">
            <Route size={24} strokeWidth={2.5} />
            <span>การเดินรถ</span>
          </div>
          <ChevronDown size={18} />
        </div>

        <div className="flex items-center justify-between px-3 py-3 text-[#1a4d2e] font-bold hover:bg-gray-50 rounded-xl cursor-pointer">
          <div className="flex items-center gap-4">
            <Users2 size={24} strokeWidth={2.5} />
            <span>คนขับรถ</span>
          </div>
          <ChevronDown size={18} />
        </div>

        <div className="flex items-center justify-between px-3 py-3 text-[#1a4d2e] font-bold hover:bg-gray-50 rounded-xl cursor-pointer border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center gap-4">
            <Wrench size={24} strokeWidth={2.5} />
            <span>ซ่อมบำรุง</span>
          </div>
          <ChevronDown size={18} />
        </div>
      </nav>

      {/* ปุ่มย่อเมนู */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition-colors px-3 py-2 w-full"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">ย่อเมนู</span>
        </button>
      </div>
    </aside>
  );
}