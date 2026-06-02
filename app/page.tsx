"use client";

import React, { useState } from 'react';
import { Car, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import PolicyTable from '../components/PolicyTable';

type VehicleDocType = 'act' | 'tax' | 'insurance' | 'inspection' | 'registration_book';

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

// ข้อมูลจำลอง (Mock Data)
const initialDocs: VehicleDocument[] = [
  { chassis: 'CHAS-001', licensePlate: '1กข 1234', project: 'รถขนส่งสายเหนือ', docType: 'act', issuer: 'วิริยะประกันภัย', docNumber: '2510193259582', expiryDate: '2026-10-15' },
  { chassis: 'CHAS-002', licensePlate: '2กค 5678', project: 'รถผู้บริหาร', docType: 'tax', issuer: 'กรมการขนส่งทางบก', docNumber: 'TAX-9988', expiryDate: '2026-06-15' },
  { chassis: 'CHAS-003', licensePlate: '3กง 9012', project: 'รถโรงเรียน', docType: 'insurance', issuer: 'กรุงเทพประกันภัย', docNumber: 'INS-1122', expiryDate: '2026-05-10' },
  { chassis: 'CHAS-004', licensePlate: 'กก 1111', project: 'ส่วนกลาง', docType: 'registration_book', issuer: 'กรมการขนส่งทางบก', docNumber: 'REG-5555' },
];

export default function DashboardPage() {
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);

  // ฟังก์ชันคำนวณสถิติ
  const calculateStats = () => {
    let active = 0;
    let warning = 0;
    let expired = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    documents.forEach(doc => {
      if (!doc.expiryDate) {
        active++;
        return;
      }
      const expiry = new Date(doc.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) expired++;
      else if (diffDays <= 30) warning++;
      else active++;
    });

    return { total: documents.length, active, warning, expired };
  };

  const stats = calculateStats();

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* 📍 กล่องสถิติ 4 กล่อง (ดึงดีไซน์ตามรูปภาพอ้างอิง) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* กล่อง 1: รถทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">รถทั้งหมด</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Car size={28} strokeWidth={1.5} />
          </div>
        </div>

        {/* กล่อง 2: ปกติ */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">ปกติ</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.active}</h3>
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <CheckCircle2 size={28} strokeWidth={1.5} />
          </div>
        </div>

        {/* กล่อง 3: แจ้งเตือน */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">ใกล้หมดอายุ (30 วัน)</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.warning}</h3>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
            <AlertCircle size={28} strokeWidth={1.5} />
          </div>
        </div>

        {/* กล่อง 4: หมดอายุ */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">หมดอายุ</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.expired}</h3>
          </div>
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <XCircle size={28} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* ตารางเอกสาร */}
      <PolicyTable documents={documents} setDocuments={setDocuments} />
    </div>
  );
}