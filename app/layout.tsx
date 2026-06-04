"use client";

import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Noto_Sans_Thai } from 'next/font/google';
import { useState } from 'react';

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['latin', 'thai'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <html lang="th">
      <body className={`${notoSansThai.className} bg-[#f4f7fe] min-h-screen text-gray-800`}>
        
        {/* Header อยู่บนสุด ล็อกติดขอบ */}
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex pt-[70px] min-h-screen">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          
          {/* พื้นที่เนื้อหาหลัก - จะปรับ margin-left อัตโนมัติตามสถานะ Sidebar */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
            <main className="p-8">
              {children}
            </main>
          </div>
        </div>

      </body>
    </html>
  );
}