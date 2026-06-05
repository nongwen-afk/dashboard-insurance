"use client";

import './globals.css';
import Sidebar from '@/components/Sidebar'; 
import Header from '@/components/Header';   
import { Noto_Sans_Thai } from 'next/font/google';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['latin', 'thai'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // คุม sidebar จาก layout เพื่อให้ Header และ Sidebar ใช้ state เปิด/ปิดชุดเดียวกันทุกหน้า
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="th">
      <body className={`${notoSansThai.className} bg-[#f4f7fe] min-h-screen text-gray-800`}>
        
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex pt-[70px] min-h-screen w-full max-w-full overflow-x-hidden">
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          
          {/* Backdrop for mobile */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs top-[70px]"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          <div className={`flex-1 min-w-0 w-full max-w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-[280px] ml-0' : 'ml-0'}`}>
            <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
              {children}
            </main>
          </div>
        </div>

        <Toaster 
          position="top-right" 
          containerStyle={{ zIndex: 99999 }}
          // toast ต้องอยู่เหนือ modal/backdrop เพื่อให้ผู้ใช้เห็น feedback หลัง action ทันที
          toastOptions={{ 
            style: { 
              fontFamily: 'inherit',
              fontSize: '14px',
              borderRadius: '10px', 
            } 
          }} 
        />
        <Analytics />
        <SpeedInsights />
        
      </body>
    </html>
  );
}
