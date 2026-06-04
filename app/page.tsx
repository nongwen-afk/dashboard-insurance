"use client";

import React, { useState, useMemo } from 'react';
import { Files, CheckCircle2, AlertCircle, XCircle, BellRing, CalendarDays, FileText, Car, User, Building2 } from 'lucide-react';
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

// 📍 ใส่ข้อมูล issuedDate สมมติให้ครบทุกคัน (ย้อนหลัง 1 ปี)
const initialDocsSeed: VehicleDocument[] = [
  { chassis: 'CHAS-001', licensePlate: '1กข 1111', docType: 'act', issuedDate: '2025-06-15', expiryDate: '2026-06-15', driverName: 'สมชาย ใจดี', project: 'สายเหนือ' },
  { chassis: 'CHAS-002', licensePlate: '2กค 2222', docType: 'tax', issuedDate: '2025-06-20', expiryDate: '2026-06-20', driverName: 'สมศรี รักงาน', project: 'ผู้บริหาร' },
  { chassis: 'CHAS-003', licensePlate: '3กง 3333', docType: 'insurance', issuedDate: '2025-06-25', expiryDate: '2026-06-25', driverName: 'วิชัย เก่งกล้า' },
  { chassis: 'CHAS-004', licensePlate: '4กข 4444', docType: 'act', issuedDate: '2025-07-05', expiryDate: '2026-07-05', driverName: 'มานพ' },
  { chassis: 'CHAS-005', licensePlate: '5กค 5555', docType: 'tax', issuedDate: '2025-07-12', expiryDate: '2026-07-12', driverName: 'สุดา' },
  { chassis: 'CHAS-006', licensePlate: '6กง 6666', docType: 'insurance', issuedDate: '2025-07-28', expiryDate: '2026-07-28', driverName: 'ปรีชา' },
  { chassis: 'CHAS-007', licensePlate: '7กข 7777', docType: 'act', issuedDate: '2025-08-10', expiryDate: '2026-08-10', driverName: 'นิภา' },
  { chassis: 'CHAS-008', licensePlate: '8กค 8888', docType: 'tax', issuedDate: '2025-08-15', expiryDate: '2026-08-15', driverName: 'สมปอง' },
  { chassis: 'CHAS-009', licensePlate: '9กง 9999', docType: 'act', issuedDate: '2025-08-20', expiryDate: '2026-08-20', driverName: 'วิรัช' },
  { chassis: 'CHAS-010', licensePlate: '1กข 1010', docType: 'insurance', issuedDate: '2025-08-25', expiryDate: '2026-08-25', driverName: 'อารีย์' },
  { chassis: 'CHAS-011', licensePlate: '2กค 2020', docType: 'tax', issuedDate: '2025-09-05', expiryDate: '2026-09-05', driverName: 'สุรศักดิ์' },
  { chassis: 'CHAS-012', licensePlate: '3กง 3030', docType: 'act', issuedDate: '2025-09-18', expiryDate: '2026-09-18', driverName: 'นารี' },
  { chassis: 'CHAS-013', licensePlate: '4กข 4040', docType: 'insurance', issuedDate: '2025-10-10', expiryDate: '2026-10-10', driverName: 'กมล' },
  { chassis: 'CHAS-014', licensePlate: '5กค 5050', docType: 'tax', issuedDate: '2025-10-22', expiryDate: '2026-10-22', driverName: 'ประยุทธ์' },
  { chassis: 'CHAS-015', licensePlate: '6กง 6060', docType: 'act', issuedDate: '2025-11-05', expiryDate: '2026-11-05', driverName: 'มณี' },
  { chassis: 'CHAS-016', licensePlate: '7กข 7070', docType: 'registration_book', issuedDate: '2019-01-10' }, 
  { chassis: 'CHAS-017', licensePlate: '8กค 8080', docType: 'registration_book', issuedDate: '2020-03-15' }, 
  { chassis: 'CHAS-018', licensePlate: '9กง 9090', docType: 'act', issuedDate: '2025-05-10', expiryDate: '2026-05-10', driverName: 'สมเกียรติ' }, 
  { chassis: 'CHAS-019', licensePlate: '1กข 1212', docType: 'tax', issuedDate: '2025-05-20', expiryDate: '2026-05-20', driverName: 'วรรณา' }, 
  { chassis: 'CHAS-020', licensePlate: '2กค 2323', docType: 'insurance', issuedDate: '2025-06-05', expiryDate: '2026-06-05', driverName: 'ธนากร' }, 
];

const issuersByType: Record<VehicleDocType, string> = {
  act: 'กรมการขนส่งทางบก',
  tax: 'กรมการขนส่งทางบก',
  insurance: 'EVT Insurance Broker',
  inspection: 'ศูนย์ตรวจสภาพรถ EVT',
  registration_book: 'สำนักงานขนส่งจังหวัด',
};

const initialDocs: VehicleDocument[] = initialDocsSeed.map((doc, index) => ({
  issuer: issuersByType[doc.docType],
  docNumber: `${doc.docType.toUpperCase()}-${String(index + 1).padStart(5, '0')}`,
  note: doc.expiryDate
    ? `ตรวจสอบเอกสารรอบถัดไปก่อนวันหมดอายุ 30 วัน`
    : 'เอกสารประเภทนี้ไม่มีวันหมดอายุ แต่ควรตรวจสอบข้อมูลทะเบียนให้ตรงกับรถจริง',
  hasAttachment: index % 3 !== 1,
  project: doc.project || 'ส่วนกลาง',
  ...doc,
}));

const formatThaiDate = (dateString?: string) => {
  if (!dateString) return '-';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const getDocTypeName = (type: VehicleDocType) => {
  const types: Record<VehicleDocType, string> = {
    act: 'พ.ร.บ.',
    tax: 'ภาษี',
    insurance: 'ประกันภัย',
    inspection: 'ตรอ.',
    registration_book: 'เล่มทะเบียน',
  };
  return types[type];
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocs);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedExpiryMonth, setSelectedExpiryMonth] = useState<{ name: string; docs: VehicleDocument[] } | null>(null);
  const [selectedAlertDoc, setSelectedAlertDoc] = useState<VehicleDocument | null>(null);

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
    const dataMap: Record<string, VehicleDocument[]> = {};
    
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      dataMap[`${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`] = [];
    }

    documents.forEach(doc => {
      if (!doc.expiryDate) return;
      const expDate = new Date(doc.expiryDate);
      const key = `${months[expDate.getMonth()]} ${expDate.getFullYear().toString().slice(-2)}`;
      if (dataMap[key] !== undefined) {
        dataMap[key].push(doc);
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      value: dataMap[key].length,
      docs: dataMap[key].sort((a, b) => new Date(a.expiryDate || 0).getTime() - new Date(b.expiryDate || 0).getTime())
    }));
  }, [documents]);

  const alertsList = useMemo(() => {
    const types: Record<string, string> = { act: 'พ.ร.บ.', tax: 'ภาษี', insurance: 'ประกันภัย', inspection: 'ตรอ.', registration_book: 'เล่มทะเบียน' };
    const today = new Date().setHours(0,0,0,0);

    return documents
      .filter(doc => {
        if (!doc.expiryDate) return false;
        const diffDays = Math.ceil((new Date(doc.expiryDate).getTime() - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 30; 
      })
      .map((doc, index) => {
        const diffDays = Math.ceil((new Date(doc.expiryDate!).getTime() - today) / (1000 * 60 * 60 * 24));
        const isExpired = diffDays < 0;
        const docName = types[doc.docType] || doc.docType;

        let daysText = '';
        if (diffDays < 0) {
            daysText = `(เลยกำหนด ${Math.abs(diffDays)} วัน)`;
        } else if (diffDays === 0) {
            daysText = `(หมดอายุวันนี้)`;
        } else {
            daysText = `(เหลืออีก ${diffDays} วัน)`;
        }

        return {
          id: `alert-${index}`,
          text: `รถทะเบียน ${doc.licensePlate || doc.chassis} - ${docName} ${isExpired ? 'หมดอายุ' : 'ใกล้หมดอายุ'}`,
          type: isExpired ? 'error' : 'warning',
          date: formatThaiDate(doc.expiryDate),
          daysText: daysText,
          diffDays,
          doc,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays); 
  }, [documents]);

  const topUrgentDocs = alertsList.slice(0, 4);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
          <span>รายการยานพาหนะ</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700">เอกสารยานพาหนะ</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#006b2f]">
          รายการเอกสารยานพาหนะ
        </h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">เอกสารทั้งหมด</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
            <p className="text-xs font-medium text-gray-400 mt-1">รายการในระบบ</p>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Files size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">ใช้งานได้</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.active}</h3>
            <p className="text-xs font-medium text-gray-400 mt-1">ยังไม่ถึงกำหนด</p>
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-500"><CheckCircle2 size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">ใกล้หมดอายุ</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.warning}</h3>
            <p className="text-xs font-medium text-gray-400 mt-1">ภายใน 30 วัน</p>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-orange-500"><AlertCircle size={28} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">หมดอายุแล้ว</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.expired}</h3>
            <p className="text-xs font-medium text-gray-400 mt-1">ต้องดำเนินการ</p>
          </div>
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500"><XCircle size={28} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">เอกสารหมดอายุ</h3>
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
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value > 0 ? '#1a4d2e' : '#e5e7eb'}
                      cursor="pointer"
                      onClick={() => setSelectedExpiryMonth({ name: entry.name, docs: entry.docs })}
                    />
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
            <h3 className="text-lg font-bold text-gray-800">แจ้งเตือน(ด่วน)</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[250px] custom-scrollbar">
            {topUrgentDocs.length > 0 ? (
              topUrgentDocs.map((doc) => {
                const isExpired = doc.type === 'error';
                return (
	                  <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedAlertDoc(doc.doc)}
                      className={`w-full text-left p-3 rounded-xl border ${isExpired ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'} transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]/30`}
                    >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 line-clamp-1 flex-1 pr-2">{doc.text.split(' - ')[0]}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${isExpired ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isExpired ? 'หมดอายุแล้ว' : 'ใกล้หมด'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 text-xs mt-2 font-medium">
                      <span className="line-clamp-1">
                        {doc.text.split(' - ')[1]} 
                        <span className={`ml-1 font-bold ${isExpired ? 'text-red-500' : 'text-orange-500'}`}>
                          {doc.daysText}
                        </span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <CalendarDays size={12} className={isExpired ? 'text-red-400' : 'text-orange-400'} />
                        <span>{doc.date}</span>
                      </div>
                    </div>
	                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-8">
                <CheckCircle2 size={32} className="text-green-400 opacity-50" />
                <p className="text-sm font-medium">เยี่ยมมาก! ไม่มีรายการค้าง</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button 
              onClick={() => setIsAlertModalOpen(true)} 
              className="w-full text-center text-sm font-bold text-[#1a4d2e] hover:text-[#123620] hover:underline transition-colors py-1"
            >
              ดูการแจ้งเตือนทั้งหมด
            </button>
          </div>
        </div>

      </div>

      <PolicyTable documents={documents} setDocuments={setDocuments} />

      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-4 border-b bg-red-50/80">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600 stroke-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="font-bold text-red-800 text-lg">การแจ้งเตือนทั้งหมด ({alertsList.length})</h3>
              </div>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
              {alertsList.length > 0 ? (
	                alertsList.map(alert => (
	                  <button
                      type="button"
                      key={alert.id}
                      onClick={() => {
                        setSelectedAlertDoc(alert.doc);
                      }}
                      className="w-full text-left bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:border-red-200 hover:bg-red-50/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-sm ${alert.type === 'error' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 font-bold">{alert.text.split(' - ')[0]}</p>
                      <p className="text-sm text-slate-600 font-medium mt-0.5">{alert.text.split(' - ')[1]}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 text-slate-500">
                           <CalendarDays size={14} className="text-slate-400"/>
                           สิ้นสุด: {alert.date}
                        </span>
                        <span className={`font-bold ${alert.type === 'error' ? 'text-red-500' : 'text-orange-500'}`}>
                          {alert.daysText}
                        </span>
                      </div>
                    </div>
	                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีการแจ้งเตือน</div>
              )}
            </div>
            
            <div className="p-4 border-t bg-white flex justify-end">
              <button 
                onClick={() => setIsAlertModalOpen(false)} 
                className="px-5 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-colors text-sm shadow-sm"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedExpiryMonth && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-4 border-b bg-[#e8f0eb]/80">
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-full text-[#1a4d2e] shadow-sm">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">เอกสารหมดอายุเดือน {selectedExpiryMonth.name}</h3>
                  <p className="text-xs text-gray-500">{selectedExpiryMonth.docs.length} รายการ</p>
                </div>
              </div>
              <button onClick={() => setSelectedExpiryMonth(null)} className="text-slate-400 hover:text-slate-700 font-bold bg-white hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
              {selectedExpiryMonth.docs.length > 0 ? (
                selectedExpiryMonth.docs.map((doc) => (
                  <button
                    type="button"
                    key={`${doc.chassis}-${doc.docType}-${doc.expiryDate}`}
                    onClick={() => {
                      setSelectedAlertDoc(doc);
                    }}
                    className="w-full text-left bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 hover:border-[#1a4d2e]/30 hover:bg-[#e8f0eb]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]/30"
                  >
                    <div>
                      <p className="text-sm text-slate-800 font-bold">รถทะเบียน {doc.licensePlate || doc.chassis}</p>
                      <p className="text-sm text-slate-600 font-medium mt-0.5">{getDocTypeName(doc.docType)} หมดอายุ</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={14} className="text-slate-400"/>
                          สิ้นสุด: {formatThaiDate(doc.expiryDate)}
                        </span>
                        {doc.driverName && <span>ผู้รับผิดชอบ: {doc.driverName}</span>}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีเอกสารหมดอายุในเดือนนี้</div>
              )}
            </div>
            
            <div className="p-4 border-t bg-white flex justify-end">
              <button 
                onClick={() => setSelectedExpiryMonth(null)} 
                className="px-5 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-colors text-sm shadow-sm"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedAlertDoc && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[9998] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-200 flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-[#e8f0eb] p-2.5 rounded-xl text-[#1a4d2e]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">รายละเอียดข้อมูลเอกสาร</h3>
                  <p className="text-xs text-gray-500">ประเภท: {getDocTypeName(selectedAlertDoc.docType)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAlertDoc(null)} 
                className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors border border-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              <div>
                <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
                  <Car size={16} /> ข้อมูลยานพาหนะ
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ทะเบียนรถ</p>
                    <p className="font-bold text-gray-800 text-base">{selectedAlertDoc.licensePlate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">เลขตัวถัง / Chassis</p>
                    <p className="font-mono text-gray-700 font-medium">{selectedAlertDoc.chassis || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">โครงการ / Project</p>
                    <p className="font-medium text-gray-700">{selectedAlertDoc.project || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-[#1a4d2e] mb-3 flex items-center gap-2">
                  <CalendarDays size={16} /> ข้อมูลเอกสารและความคุ้มครอง
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 px-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">วันที่มีผล (Issued Date)</p>
                    <p className="font-medium text-gray-800">{formatThaiDate(selectedAlertDoc.issuedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">วันหมดอายุ (Expiry Date)</p>
                    <p className="font-medium text-gray-800">{formatThaiDate(selectedAlertDoc.expiryDate)}</p>
                  </div>
                  <div className="sm:col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-1">
                          <User size={12} /> ผู้รับผิดชอบ (Driver)
                        </p>
                        <p className="font-medium text-gray-800">{selectedAlertDoc.driverName || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-1">
                          <Building2 size={12} /> บริษัทประกัน/ผู้ออกเอกสาร
                        </p>
                        <p className="font-medium text-gray-800">{selectedAlertDoc.issuer || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">หมายเลขเอกสาร/กรมธรรม์</p>
                    <p className="font-medium text-gray-800">{selectedAlertDoc.docNumber || 'ไม่มีข้อมูล'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ไฟล์แนบ</p>
                    <p className="font-medium text-gray-800">{selectedAlertDoc.hasAttachment ? 'มีไฟล์แนบในระบบ' : 'ไม่มีไฟล์แนบ'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                    <p className="font-medium text-gray-800">{selectedAlertDoc.note || 'ไม่มีหมายเหตุ'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pt-5 pb-8 border-t bg-gray-50 flex items-center justify-end shrink-0">
              <button 
                onClick={() => setSelectedAlertDoc(null)} 
                className="min-w-24 h-11 px-6 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-bold transition-all shadow-sm shrink-0"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
