"use client";

import React, { useState, useRef } from 'react';
import { Search, Filter, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

// กำหนดประเภทของเอกสารที่ระบบรองรับ
type VehicleDocType = 'act' | 'tax' | 'insurance' | 'inspection' | 'registration_book';

// โครงสร้างข้อมูลสำหรับเอกสารรถยนต์ 1 รายการ
interface VehicleDocument {
  chassis: string;
  licensePlate?: string;
  project?: string;
  docType: VehicleDocType;
  issuer?: string;
  docNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  note?: string;
}

// กำหนด Props สำหรับรับข้อมูลและฟังก์ชันอัปเดตข้อมูลจาก Component หลัก
interface PolicyTableProps {
  documents: VehicleDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<VehicleDocument[]>>;
}

export default function PolicyTable({ documents, setDocuments }: PolicyTableProps) {
  // State สำหรับเก็บข้อความค้นหาในช่อง Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reference สำหรับอ้างอิงถึง input file ที่ถูกซ่อนไว้สำหรับอัปโหลด Excel
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ฟังก์ชันแปลงรูปแบบวันที่ (YYYY-MM-DD) ให้เป็นภาษาไทยแบบเดือนย่อ
  const formatThaiDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const d = new Date(dateString);
    
    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่ หากไม่ถูกต้องให้คืนค่าเดิม
    if (isNaN(d.getTime())) return dateString;
    
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // ฟังก์ชันคำนวณสถานะของเอกสารเทียบกับวันที่ปัจจุบัน
  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'NO_EXPIRY'; 
    
    // คำนวณหาจำนวนวันที่เหลือ
    const diffDays = Math.ceil((new Date(expiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'WARNING';
    return 'ACTIVE';
  };

  // ฟังก์ชันแปลงรหัสประเภทเอกสารเป็นชื่อภาษาไทยสำหรับแสดงผล
  const getDocTypeName = (type: VehicleDocType) => {
    const types: Record<string, string> = { act: 'พ.ร.บ.', tax: 'ภาษี', insurance: 'ประกันภัย', inspection: 'ตรอ.', registration_book: 'เล่มทะเบียน' };
    return types[type] || type;
  };

  // ฟังก์ชันจัดการกระบวนการอ่านและนำเข้าข้อมูลจากไฟล์ Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // แปลงข้อมูลจาก Sheet เป็น Array
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as (string | number | undefined)[][]; 
      
      const newImportedDocs: VehicleDocument[] = [];
      
      // ข้ามแถวแรก (Header) และวนลูปอ่านข้อมูลแถวที่เหลือ
      for (let i = 1; i < data.length; i++) {
         const row = data[i];
         if (!row || row.length === 0 || !row[0]) continue;
         
         // แมปปิ้งข้อมูลจากแต่ละคอลัมน์ใน Excel เข้าสู่ Object
         newImportedDocs.push({
           chassis: String(row[0] || `CHAS-GEN-${Date.now()}-${i}`),
           licensePlate: String(row[1] || ''),
           project: String(row[2] || ''),
           docType: (String(row[3] || 'act').toLowerCase()) as VehicleDocType,
           issuer: String(row[4] || ''),
           docNumber: String(row[5] || ''),
           expiryDate: row[6] ? String(row[6]) : undefined,
         });
      }
      
      // อัปเดตข้อมูลเข้าสู่ State หลัก
      if (newImportedDocs.length > 0) {
        setDocuments(prev => [...newImportedDocs, ...prev]);
        alert(`นำเข้าข้อมูลสำเร็จ ${newImportedDocs.length} รายการ`);
      } else {
        alert('ไม่พบข้อมูลในไฟล์ Excel');
      }
    };
    reader.readAsBinaryString(file);
    
    // เคลียร์ค่า input file เพื่อให้สามารถอัปโหลดไฟล์เดิมซ้ำได้ในครั้งต่อไป
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // กรองเอกสารตามคำค้นหา (ค้นหาจากเลขตัวถัง หรือ ทะเบียนรถ)
  const filteredDocs = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return doc.chassis.toLowerCase().includes(query) || (doc.licensePlate?.toLowerCase() || '').includes(query);
  });

  return (
    // คอนเทนเนอร์หลักของตาราง
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      
      {/* ส่วนหัวของตาราง: ค้นหาและปุ่มจัดการ */}
      <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* ช่องกรอกข้อความค้นหา */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาทะเบียนรถ, เลขตัวถัง..." 
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* กลุ่มปุ่มคำสั่งด้านขวา */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* ปุ่มตัวกรอง */}
          <button className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
            <Filter size={16} />
            ตัวกรอง
          </button>
          
          {/* input ซ่อนสำหรับเลือกไฟล์ Excel */}
          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          {/* ปุ่มเรียกคำสั่งนำเข้า Excel */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 text-white bg-green-600 border border-transparent rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shadow-sm shadow-green-600/20"
          >
            <FileSpreadsheet size={16} />
            นำเข้า Excel
          </button>
        </div>
      </div>

      {/* โครงสร้างตารางแสดงข้อมูล */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* หัวตาราง */}
          <thead className="bg-gray-50/50 border-y border-gray-100">
            <tr className="text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">ประเภทเอกสาร</th>
              <th className="px-6 py-4 font-semibold">เลขตัวถัง</th>
              <th className="px-6 py-4 font-semibold">ทะเบียนรถ</th>
              <th className="px-6 py-4 font-semibold">บริษัทประกัน/ผู้ออก</th>
              <th className="px-6 py-4 font-semibold">วันหมดอายุ</th>
              <th className="px-6 py-4 font-semibold">สถานะ</th>
            </tr>
          </thead>
          
          {/* ข้อมูลตาราง */}
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredDocs.map((doc, index) => {
              // คำนวณสถานะก่อนเรนเดอร์ในแต่ละแถว
              const currentStatus = getDocumentStatus(doc.expiryDate);
              
              return (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  {/* ข้อมูลประเภทเอกสาร */}
                  <td className="px-6 py-4 font-medium text-gray-700">{getDocTypeName(doc.docType)}</td>
                  
                  {/* ข้อมูลเลขตัวถัง */}
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{doc.chassis}</td>

                  {/* ข้อมูลทะเบียนรถ */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800">{doc.licensePlate || '-'}</span>
                  </td>
                  
                  {/* ข้อมูลผู้ออกเอกสาร */}
                  <td className="px-6 py-4 text-gray-600">{doc.issuer || '-'}</td>
                  
                  {/* ข้อมูลวันหมดอายุ */}
                  <td className="px-6 py-4 text-gray-700 font-medium">{formatThaiDate(doc.expiryDate)}</td>
                  
                  {/* ป้ายแสดงสถานะ */}
                  <td className="px-6 py-4">
                    {currentStatus === 'ACTIVE' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">ปกติ</span>}
                    {currentStatus === 'WARNING' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-700">ใกล้หมด</span>}
                    {currentStatus === 'EXPIRED' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">หมดอายุ</span>}
                    {currentStatus === 'NO_EXPIRY' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">ถาวร</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}