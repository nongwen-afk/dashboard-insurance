import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "พ.ร.บ. Dashboard",
  description: "ระบบจัดการข้อมูล พ.ร.บ. และเอกสารรถยนต์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* เพิ่ม text-gray-900 เข้าไปตรงนี้ครับ */}
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        <main className="max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}