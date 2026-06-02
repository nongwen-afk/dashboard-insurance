"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, Search, Filter, Upload } from 'lucide-react'; // <-- นำเข้า Upload
import * as XLSX from 'xlsx'; // <-- นำเข้าไลบรารีอ่าน Excel

// จำลองข้อมูลเริ่มต้น
const initialPolicies = [
  { policyNo: '2510193259582', licenseNo: '1กข 1234', vehicleMake: 'TOYOTA', endDate: '2026-10-15', premiumAmount: 645.21, status: 'ACTIVE' },
  { policyNo: '6226553319803', licenseNo: '2กค 5678', vehicleMake: 'HONDA', endDate: '2026-06-15', premiumAmount: 645.21, status: 'WARNING' },
  { policyNo: '6192133380070', licenseNo: '3กง 9012', vehicleMake: 'ISUZU', endDate: '2026-05-10', premiumAmount: 900.00, status: 'EXPIRED' },
];

export default function PolicyTable() {
  // 1. เปลี่ยนข้อมูลตารางมาเก็บใน State เพื่อให้มันอัปเดตหน้าจอได้เมื่ออัปโหลด Excel
  const [policies, setPolicies] = useState(initialPolicies);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // 2. ใช้ useRef เพื่อใช้แทนการกดปุ่ม input type="file" แบบซ่อนไว้
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full"><CheckCircle2 size={16}/> คุ้มครอง</span>;
      case 'WARNING':
        return <span className="flex items-center gap-1 text-sm font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full"><AlertCircle size={16}/> ใกล้หมดอายุ</span>;
      case 'EXPIRED':
        return <span className="flex items-center gap-1 text-sm font-medium text-red-700 bg-red-100 px-3 py-1 rounded-full"><XCircle size={16}/> ขาดต่ออายุ</span>;
      default:
        return null;
    }
  };

  // 3. ฟังก์ชันจัดการเมื่อผู้ใช้เลือกไฟล์ Excel สำเร็จ
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' }); // อ่านไฟล์ Excel
      const wsname = wb.SheetNames[0]; // ดึงข้อมูลชีทแรก
      const ws = wb.Sheets[wsname];
      // แปลงข้อมูลจาก Excel เป็น Array
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]; 
      
      // 👉 จุดที่แก้ไข: ประกาศ Type ให้ชัดเจนว่ากล่องนี้เก็บอะไรบ้าง
      type ImportedPolicy = {
        licenseNo: string;
        vehicleMake: string;
        policyNo: string;
        endDate: string;
        premiumAmount: number;
        status: string;
      };
      
      const newImportedPolicies: ImportedPolicy[] = []; // บังคับ Type ทันที
      
      // ลูปดึงข้อมูล (เริ่มที่ i = 1 เพื่อข้ามหัวตารางแถวแรก)
      for (let i = 1; i < data.length; i++) {
         const row = data[i];
         // ถ้าแถวว่าง ให้ข้าม
         if (!row || row.length === 0 || !row[0]) continue;
         
         newImportedPolicies.push({
           licenseNo: String(row[0] || ''),
           vehicleMake: String(row[1] || ''),
           policyNo: String(row[2] || ''),
           endDate: String(row[3] || ''), 
           premiumAmount: Number(row[4] || 0),
           status: 'ACTIVE' // ตั้งค่าจำลองเริ่มต้นให้รถนำเข้าใหม่เป็น "คุ้มครอง"
         });
      }
      
      if (newImportedPolicies.length > 0) {
        // อัปเดตข้อมูลตารางเดิม + ข้อมูลใหม่เข้าไป
        setPolicies(prev => [...newImportedPolicies, ...prev]);
        alert(`🎉 นำเข้าข้อมูลสำเร็จ ${newImportedPolicies.length} รายการ!`);
      } else {
        alert('ไม่พบข้อมูลในไฟล์ Excel ครับ');
      }
    };
    reader.readAsBinaryString(file);
    
    // เคลียร์ค่าไฟล์ที่อัปโหลดไปแล้ว เผื่อต้องการอัปโหลดไฟล์เดิมซ้ำ
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPolicies = policies.filter((policy) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = policy.licenseNo.toLowerCase().includes(query) || policy.policyNo.toLowerCase().includes(query) || policy.vehicleMake.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || policy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      
      <div className="p-5 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 shrink-0">รายการ พ.ร.บ. ล่าสุด</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาทะเบียน, ยี่ห้อ, เลขกรมธรรม์..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Filter size={16} />
            </div>
            <select 
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">คุ้มครอง</option>
              <option value="WARNING">ใกล้หมดอายุ</option>
              <option value="EXPIRED">ขาดต่ออายุ</option>
            </select>
          </div>

          {/* ซ่อน Input File ไว้ด้านหลัง */}
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />

          {/* ปุ่มสีเทา: นำเข้าข้อมูล */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full sm:w-auto bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shrink-0 flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            นำเข้าข้อมูล
          </button>

          {/* ปุ่มสีน้ำเงิน: เพิ่มเอกสาร (ไปหน้าฟอร์ม) */}
          <Link href="/add-policy" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0 text-center">
            + เพิ่มเอกสาร
          </Link>
        </div>
      </div>
      
      {/* 1. ล็อคความสูงสูงสุดไว้ที่ประมาณ 400px (หรือ max-h-96) และเปิดให้เลื่อนแนวตั้งได้ (overflow-y-auto) */}
      <div className="overflow-x-auto overflow-y-auto max-h-96">
        {/* 2. เพิ่ม relative เข้าไปที่ table */}
        <table className="w-full text-left border-collapse relative">
          {/* 3. ทำให้ thead ติดอยู่ด้านบนเสมอ (sticky top-0) และใส่ z-index กันข้อมูลข้างล่างลอยทับ */}
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_#e5e7eb]">
            <tr className="text-gray-500 text-sm">
              <th className="p-4 font-medium">ทะเบียนรถ</th>
              <th className="p-4 font-medium">ยี่ห้อ</th>
              <th className="p-4 font-medium">เลขที่กรมธรรม์</th>
              <th className="p-4 font-medium">วันสิ้นสุด</th>
              <th className="p-4 font-medium">เบี้ยประกัน (฿)</th>
              <th className="p-4 font-medium">สถานะ</th>
              <th className="p-4 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            
            {filteredPolicies.length > 0 ? (
              filteredPolicies.map((policy, index) => (
                <tr key={`${policy.policyNo}-${index}`} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-800">{policy.licenseNo}</td>
                  <td className="p-4 text-gray-600">{policy.vehicleMake}</td>
                  <td className="p-4 text-gray-600">{policy.policyNo}</td>
                  <td className="p-4 text-gray-600">{policy.endDate}</td>
                  <td className="p-4 text-gray-600">{Number(policy.premiumAmount).toFixed(2)}</td>
                  <td className="p-4">{getStatusBadge(policy.status)}</td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline text-sm font-medium">รายละเอียด</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}