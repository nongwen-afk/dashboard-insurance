"use client";

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// จำลองข้อมูลค่าใช้จ่ายเบี้ยประกันรายเดือน
const data = [
  { month: 'ม.ค.', amount: 12500 },
  { month: 'ก.พ.', amount: 8400 },
  { month: 'มี.ค.', amount: 15600 },
  { month: 'เม.ย.', amount: 5200 },
  { month: 'พ.ค.', amount: 9800 },
  { month: 'มิ.ย.', amount: 18000 },
];

export default function PremiumChart() {
  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">ค่าใช้จ่าย พ.ร.บ. รายเดือน</h3>
        <p className="text-sm text-gray-500">ครึ่งปีแรก 2026</p>
      </div>
      
      {/* ResponsiveContainer จะช่วยให้กราฟยืดหดตามขนาดจออัตโนมัติ */}
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
             dataKey="month" 
             axisLine={false} 
             tickLine={false} 
             tick={{ fill: '#6B7280', fontSize: 12 }} 
             dy={10} 
            />
            <YAxis 
             axisLine={false} 
             tickLine={false} 
             tick={{ fill: '#6B7280', fontSize: 12 }} 
             tickFormatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => new Intl.NumberFormat('th-TH').format(Number(value))}
            />
            <Bar 
              dataKey="amount" 
              name="ค่าเบี้ยประกัน (฿)" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}