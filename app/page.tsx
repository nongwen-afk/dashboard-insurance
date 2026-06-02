import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldX, Wallet } from 'lucide-react';
import PolicyTable from '../components/PolicyTable';
import PremiumChart from '../components/PremiumChart';
import RecentAlerts from '../components/RecentAlerts';

export default function DashboardOverview() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">ภาพรวมสถานะ พ.ร.บ. และเอกสารรถยนต์ทั้งหมด</p>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Active */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">ความคุ้มครองปกติ</p>
            <h3 className="text-2xl font-bold text-gray-800">124 <span className="text-sm font-normal text-gray-500">คัน</span></h3>
          </div>
        </div>

        {/* Card 2: Expiring Soon */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">ใกล้หมดอายุ (30 วัน)</p>
            <h3 className="text-2xl font-bold text-gray-800">12 <span className="text-sm font-normal text-gray-500">คัน</span></h3>
          </div>
        </div>

        {/* Card 3: Expired */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <ShieldX size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">พ.ร.บ. ขาดต่อ</p>
            <h3 className="text-2xl font-bold text-gray-800">3 <span className="text-sm font-normal text-gray-500">คัน</span></h3>
          </div>
        </div>

        {/* Card 4: Total Premium */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">ค่าใช้จ่าย พ.ร.บ. ปีนี้</p>
            <h3 className="text-2xl font-bold text-gray-800">85,420฿</h3>
          </div>
        </div>

      </div>

      {/* พื้นที่สำหรับใส่กราฟและการแจ้งเตือน */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* กล่องซ้าย: กราฟ */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-96 flex items-center justify-center">
          <PremiumChart />
        </div>
        
        {/* กล่องขวา: การแจ้งเตือน */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-96 flex flex-col">
          <RecentAlerts />
        </div>

      </div>
      
      {/* พื้นที่ตาราง */}
      <div className="mt-8">
        <PolicyTable />
      </div>

    </div>
  );
}