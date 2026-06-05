"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ExpiryMonthGroup } from '@/types';

interface ChartMonth extends ExpiryMonthGroup {
  value: number;
}

interface ExpiryChartProps {
  chartData: ChartMonth[];
  onSelectMonth: (month: ExpiryMonthGroup) => void;
}

export default function ExpiryChart({ chartData, onSelectMonth }: ExpiryChartProps) {
  // กราฟรับข้อมูลที่ grouped มาแล้วจากหน้า dashboard และส่งเดือนที่คลิกกลับไปเปิด modal
  return (
    <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col w-full overflow-hidden">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">เอกสารหมดอายุ</h3>
        <p className="text-sm text-gray-500">จำนวนเอกสารที่จะหมดอายุในอีก 6 เดือนข้างหน้า</p>
      </div>
      <div className="flex-1 min-h-[250px] w-full min-w-0 overflow-hidden">
        {/* กำหนด height คงที่เพื่อให้ Recharts render ได้ถูกต้องทั้งตอน build และบน browser */}
        <ResponsiveContainer width="100%" height={250} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#1a4d2e" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip
              cursor={{ fill: '#f8fafc', radius: 8 }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
              formatter={(value) => [`${value} รายการ`, 'หมดอายุ']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? 'url(#chartBarGradient)' : '#e2e8f0'}
                  cursor="pointer"
                  onClick={() => onSelectMonth({ name: entry.name, docs: entry.docs })}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
