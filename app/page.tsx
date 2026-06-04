"use client";

import React, { useState, useMemo } from 'react';
import { Car, CheckCircle2, AlertCircle, XCircle, BellRing, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
  driverName?: string;
  hasAttachment?: boolean;
}

// 📍 ข้อมูลจำลอง (Mock Data) 20 รายการ ที่หายไป
const initialDocs: VehicleDocument[] = [
  { chassis: 'CHAS-001', licensePlate: '1กข 1111', docType: 'act', expiryDate: '2026-06-15', driverName: 'สมชาย ใจดี', project: 'สายเหนือ', issuer: 'วิริยะประกันภัย' },
  { chassis: 'CHAS-002', licensePlate: '2กค 2222', docType: 'tax', expiryDate: '2026-06-20', driverName: 'สมศรี รักงาน', project: 'ผู้บริหาร' },
  { chassis: 'CHAS-003', licensePlate: '3กง 3333', docType: 'insurance', expiryDate: '2026-06-25', driverName: 'วิชัย เก่งกล้า', issuer: 'กรุงเทพประกันภัย' },
  { chassis: 'CHAS-004', licensePlate: '4กข 4444', docType: 'act', expiryDate: '2026-07-05', driverName: 'มานพ' },
  { chassis: 'CHAS-005', licensePlate: '5กค 5555', docType: 'tax', expiryDate: '2026-07-12', driverName: 'สุดา' },
  { chassis: 'CHAS-006', licensePlate: '6กง 6666', docType: 'insurance', expiryDate: '2026-07-28', driverName: 'ปรีชา' },
  { chassis: 'CHAS-007', licensePlate: '7กข 7777', docType: 'act', expiryDate: '2026-08-10', driverName: 'นิภา' },
  { chassis: 'CHAS-008', licensePlate: '8กค 8888', docType: 'tax', expiryDate: '2026-08-15', driverName: 'สมปอง' },
  { chassis: 'CHAS-009', licensePlate: '9กง 9999', docType: 'act', expiryDate: '2026-08-20', driverName: 'วิรัช' },
  { chassis: 'CHAS-010', licensePlate: '1กข 1010', docType: 'insurance', expiryDate: '2026-08-25', driverName: 'อารีย์' },
  { chassis: 'CHAS-011', licensePlate: '2กค 2020', docType: 'tax', expiryDate: '2026-09-05', driverName: 'สุรศักดิ์' },
  { chassis: 'CHAS-012', licensePlate: '3กง 3030', docType: 'act', expiryDate: '2026-09-18', driverName: 'นารี' },
  { chassis: 'CHAS-013', licensePlate: '4กข 4040', docType: 'insurance', expiryDate: '2026-10-10', driverName: 'กมล' },
  { chassis: 'CHAS-014', licensePlate: '5กค 5050', docType: 'tax', expiryDate: '2026-10-22', driverName: 'ประยุทธ์' },
  { chassis: 'CHAS-015', licensePlate: '6กง 6060', docType: 'act', expiryDate: '2026-11-05', driverName: 'มณี' },
  { chassis: 'CHAS-016', licensePlate: '7กข 7070', docType: 'registration_book' }, 
  { chassis: 'CHAS-017', licensePlate: '8กค 8080', docType: 'registration_book' }, 
  { chassis: 'CHAS-018', licensePlate: '9กง 9090', docType: 'act', expiryDate: '2026-05-10', driverName: 'สมเกียรติ' }, 
  { chassis: 'CHAS-019', licensePlate: '1กข 1212', docType: 'tax', expiryDate: '2026-05-20', driverName: 'วรรณา' }, 
  { chassis: 'CHAS-020', licensePlate: '2กค 2323', docType: 'insurance', expiryDate: '2026-06-05', driverName: 'ธนากร' }, 
];

export default function DashboardPage() {
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);

  const stats = useMemo(() => {
    let active = 0, warning = 0, expired = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    documents.forEach(doc => {
      if (!doc.expiryDate) { active++; return; }
      const diffDays = Math.ceil((new Date(doc.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) expired++;
      else if (diffDays <= 30) warning++;
      else active++;
    });
    return { total: documents.length, active, warning, expired };
  }, [documents]);

  const chartData = useMemo(() => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const dataMap: Record<string, number> = {};
    
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      dataMap[`${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`] = 0;
    }

    documents.forEach(doc => {
      if (!doc.expiryDate) return;
      const expDate = new Date(doc.expiryDate);
      const key = `${months[expDate.getMonth()]} ${expDate.getFullYear().toString().slice(-2)}`;
      if (dataMap[key] !== undefined) {
        dataMap[key] += 1;
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      value: dataMap[key]
    }));
  }, [documents]);

  const urgentDocs = useMemo(() => {
    return documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const diffDays = Math.ceil((new Date(doc.expiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
      return diffDays <= 30; 
    }).sort((a, b) => {
      const today = new Date().setHours(0,0,0,0);
      const diffA = Math.ceil((new Date(a.expiryDate!).getTime() - today) / (1000 * 60 * 60 * 24));
      const diffB = Math.ceil((new Date(b.expiryDate!).getTime() - today) / (1000 * 60 * 60 * 24));
      return diffA - diffB;
    });
  }, [documents]);

  return (
    <div className="w-full flex flex-col gap-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">รถทั้งหมด</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Car size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">ปกติ</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.active}</h3>
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">แจ้งเตือน</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.warning}</h3>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-orange-500"><AlertCircle size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">หมดอายุ</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.expired}</h3>
          </div>
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500"><XCircle size={28} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">คาดการณ์เอกสารหมดอายุ</h3>
            <p className="text-sm text-gray-500">จำนวนเอกสารที่จะหมดอายุในอีก 6 เดือนข้างหน้า</p>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} รายการ`, 'หมดอายุ']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#1a4d2e' : '#e5e7eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="bg-red-100 p-2 rounded-full">
              <BellRing size={18} className="text-red-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">ต้องดำเนินการด่วน</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[250px] custom-scrollbar">
            {urgentDocs.length > 0 ? (
              urgentDocs.map((doc, idx) => {
                const isExpired = new Date(doc.expiryDate!).getTime() < new Date().getTime();
                return (
                  <div key={idx} className={`p-3 rounded-xl border ${isExpired ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800">{doc.licensePlate || doc.chassis}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${isExpired ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isExpired ? 'หมดอายุแล้ว' : 'ใกล้หมด'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-2 font-medium">
                      <CalendarDays size={14} className={isExpired ? 'text-red-400' : 'text-orange-400'} />
                      <span>{doc.expiryDate}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-8">
                <CheckCircle2 size={32} className="text-green-400 opacity-50" />
                <p className="text-sm font-medium">เยี่ยมมาก! ไม่มีรายการค้าง</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* เรียกใช้งานตาราง */}
      <PolicyTable documents={documents} setDocuments={setDocuments} />
    </div>
  );
}