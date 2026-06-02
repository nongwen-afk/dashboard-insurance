"use client";

import React, { useState } from 'react';
import Link from 'next/link'; // <-- เพิ่มบรรทัดนี้ด้านบนสุด
import { InsurancePolicy } from '../types';
import { CheckCircle2, AlertCircle, XCircle, Search, Filter } from 'lucide-react'; // <-- เพิ่ม icon Filter

// จำลองข้อมูล พ.ร.บ. ในระบบ
const mockPolicies: InsurancePolicy[] = [
  { policyNo: '2510193259582', licenseNo: '1กข 1234', vehicleMake: 'TOYOTA', endDate: '2026-10-15', premiumAmount: 645.21, status: 'ACTIVE' },
  { policyNo: '6226553319803', licenseNo: '2กค 5678', vehicleMake: 'HONDA', endDate: '2026-06-15', premiumAmount: 645.21, status: 'WARNING' },
  { policyNo: '6192133380070', licenseNo: '3กง 9012', vehicleMake: 'ISUZU', endDate: '2026-05-10', premiumAmount: 900.00, status: 'EXPIRED' },
];

export default function PolicyTable() {
  const [searchQuery, setSearchQuery] = useState('');
  // 1. เพิ่ม State สำหรับเก็บค่า Dropdown สถานะ (ค่าเริ่มต้นคือ ALL)
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // 2. ปรับปรุงการกรอง ให้เช็กทั้งช่องค้นหา และ Dropdown ไปพร้อมกัน
  const filteredPolicies = mockPolicies.filter((policy) => {
    // เช็กช่องค้นหา
    const query = searchQuery.toLowerCase();
    const matchesSearch = policy.licenseNo.toLowerCase().includes(query) || policy.policyNo.toLowerCase().includes(query);
    
    // เช็ก Dropdown
    const matchesStatus = statusFilter === 'ALL' || policy.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      
      <div className="p-5 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 shrink-0">รายการ พ.ร.บ. ล่าสุด</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          
          {/* ช่องค้นหา */}
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาทะเบียน, เลขกรมธรรม์..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 3. เพิ่ม Dropdown สำหรับเลือกสถานะ */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Filter size={16} />
            </div>
            <select 
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">คุ้มครอง</option>
              <option value="WARNING">ใกล้หมดอายุ</option>
              <option value="EXPIRED">ขาดต่ออายุ</option>
            </select>
          </div>

          <Link href="/add-policy" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0 text-center">
            + เพิ่มเอกสาร
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
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
              filteredPolicies.map((policy) => (
                <tr key={policy.policyNo} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-800">{policy.licenseNo}</td>
                  <td className="p-4 text-gray-600">{policy.vehicleMake}</td>
                  <td className="p-4 text-gray-600">{policy.policyNo}</td>
                  <td className="p-4 text-gray-600">{policy.endDate}</td>
                  <td className="p-4 text-gray-600">{policy.premiumAmount.toFixed(2)}</td>
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