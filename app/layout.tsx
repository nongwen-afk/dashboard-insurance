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
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {/* จัดให้เนื้อหาหลักอยู่กึ่งกลางและมีความกว้างสูงสุดที่เหมาะสม */}
        <main className="max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}