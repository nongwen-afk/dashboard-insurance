import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Noto_Sans_Thai } from 'next/font/google';

// ตั้งค่าฟอนต์ Noto Sans Thai
const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['latin', 'thai'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      {/* ใช้ flex-col เพื่อเรียงจากบนลงล่าง */}
      <body className={`${notoSansThai.className} bg-[#f4f7fe] flex flex-col min-h-screen`}>
        
        {/* แถบ Header ด้านบนสุด (กว้างเต็มจอ) */}
        <Header />
        
        {/* คอนเทนเนอร์สำหรับพื้นที่ด้านล่าง Header 
            ใช้ mt-[70px] เพื่อดันทุกอย่างลงมาไม่ให้โดน Header ที่ถูก Fixed ไว้ทับ 
        */}
        <div className="flex flex-1 mt-[70px]">
          
          {/* แถบเมนูด้านซ้าย */}
          <Sidebar />
          
          {/* พื้นที่แสดงผลเนื้อหาหลัก 
              ใช้ ml-[280px] เพื่อดันเนื้อหาให้เว้นที่ว่างให้ Sidebar 
          */}
          <div className="flex-1 ml-[280px] flex flex-col">
            <main className="p-8">
              {children}
            </main>
          </div>
          
        </div>
      </body>
    </html>
  );
}