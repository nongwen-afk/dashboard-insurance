"use client";

import React from 'react';
import { InsurancePolicy } from '../types';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

// จำลองข้อมูล พ.ร.บ. ในระบบ
const mockPolicies: InsurancePolicy[] = [
  { policyNo: '2510193259582', licenseNo: '1กข 1234', vehicleMake: 'TOYOTA', endDate: '2026-10-15', premiumAmount: 645.21, status: 'ACTIVE' },
  { policyNo: '6226553319803', licenseNo: '2กค 5678', vehicleMake: 'HONDA', endDate: '2026-06-15', premiumAmount: 645.21, status: 'WARNING' },
  { policyNo: '6192133380070', licenseNo: '3กง 9012', vehicleMake: 'ISUZU', endDate: '2026-05-10', premiumAmount: 900.00, status: 'EXPIRED' },
];

export default function PolicyTable() {
  // ฟังก์ชันสำหรับเลือกสีและไอคอนตามสถานะ
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">รายการ พ.ร.บ. ล่าสุด</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + เพิ่มเอกสาร
        </button>
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
            {mockPolicies.map((policy) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}