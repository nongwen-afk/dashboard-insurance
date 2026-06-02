"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- นำเข้า useRouter สำหรับเด้งหน้า
import { ArrowLeft, Save } from 'lucide-react';

export default function AddPolicyPage() {
  const router = useRouter();

  // 1. สร้าง State ก้อนเดียวรวมสำหรับเก็บค่าทุกช่องในฟอร์ม
  const [formData, setFormData] = useState({
    licenseNo: '',
    vehicleMake: '',
    policyNo: '',
    endDate: '',
    premiumAmount: '',
  });

  // 2. ฟังก์ชันส่วนกลางสำหรับอัปเดต State ตามชื่อช่อง (name) ที่ผู้ใช้พิมพ์
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. ฟังก์ชันจัดการเมื่อกด Submit ฟอร์ม
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบ Validation เบื้องต้นว่ากรอกช่องจำเป็นครบไหม
    if (!formData.licenseNo || !formData.policyNo || !formData.endDate || !formData.premiumAmount) {
      alert('กรุณากรอกข้อมูลช่องที่มีเครื่องหมาย * ให้ครบถ้วนครับ');
      return;
    }

    // จุดนี้ในอนาคตจะใช้สำหรับเชื่อมต่อฐานข้อมูล ยิง API หรือเรียก Server Action
    console.log('ข้อมูล พ.ร.บ. ที่พร้อมบันทึก:', formData);
    
    alert('บันทึกข้อมูล (จำลอง) สำเร็จ!');
    
    // บันทึกเสร็จแล้วสั่งย้ายหน้ากลับไปที่หน้าหลักทันที
    router.push('/');
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      
      {/* ส่วนหัว */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="text-gray-600" size={24} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">เพิ่มเอกสาร พ.ร.บ. ใหม่</h2>
          <p className="text-gray-500">กรอกข้อมูลรายละเอียดกรมธรรม์เพื่อบันทึกลงระบบ</p>
        </div>
      </div>

      {/* กล่องฟอร์ม */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* ผูกฟังก์ชันเข้ากับอีเวนต์ onSubmit ของฟอร์ม */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ทะเบียนรถ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนรถ *</label>
              <input 
                type="text" 
                name="licenseNo"
                placeholder="เช่น 1กข 1234" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" 
                value={formData.licenseNo}
                onChange={handleChange}
              />
            </div>

            {/* ยี่ห้อรถ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อรถ</label>
              <input 
                type="text" 
                name="vehicleMake"
                placeholder="เช่น TOYOTA, HONDA" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" 
                value={formData.vehicleMake}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* เลขที่กรมธรรม์ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่กรมธรรม์ *</label>
            <input 
              type="text" 
              name="policyNo"
              placeholder="ระบุเลขที่กรมธรรม์ 13 หลัก" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" 
              value={formData.policyNo}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* วันสิ้นสุดความคุ้มครอง */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุดความคุ้มครอง *</label>
              <input 
                type="date" 
                name="endDate"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" 
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            {/* เบี้ยประกัน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบี้ยประกัน (บาท) *</label>
              <input 
                type="number" 
                name="premiumAmount"
                placeholder="0.00" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" 
                value={formData.premiumAmount}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* ปุ่มกด */}
          <div className="flex justify-end gap-3">
            <Link href="/" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              ยกเลิก
            </Link>
            {/* เปลี่ยนปุ่มเป็น type="submit" เพื่อให้ส่งข้อมูลผ่านฟอร์ม */}
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
              <Save size={18} />
              บันทึกข้อมูล
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}