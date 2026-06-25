"use client";

import React, { useState } from 'react';
import { X, Calendar, FileText, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import type { VehicleDocType, VehicleDocument } from '@/types';
import { createVehicleDocumentRecords } from '@/utils/vehicleDocumentApi';
import { captureHandledError } from '@/utils/sentry';
import { findChassis, findLicensePlate, findDocNumber, findIssuer, extractDateFromString } from '@/utils/ocrParser';
import { OCR_TEMPLATES, type OcrTemplate } from '@/utils/ocrTemplates';
import OcrTemplateStudio from '@/components/dashboard/OcrTemplateStudio';
import { preprocessOcrImage } from '@/utils/imagePreprocessor';

const getImgSize = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const getFieldLabel = (field: string) => {
  switch (field) {
    case 'issuer': return 'บริษัทผู้รับประกัน';
    case 'docNumber': return 'เลขที่เอกสาร/กรมธรรม์';
    case 'issuedDate': return 'วันเริ่มคุ้มครอง';
    case 'expiryDate': return 'วันหมดอายุ';
    case 'licensePlate': return 'เลขทะเบียนรถ';
    case 'chassis': return 'เลขตัวถัง';
    default: return field;
  }
};

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: VehicleDocument) => void;
  defaultExpiryDate?: string;
}

const createManualDocumentId = () => `manual-${Date.now()}`;

export default function AddDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultExpiryDate,
}: AddDocumentModalProps) {
  const [chassis, setChassis] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [project, setProject] = useState('');
  const [docType, setDocType] = useState<VehicleDocType>('act');
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate || '');
  const [issuedDate, setIssuedDate] = useState('');
  const [issuer, setIssuer] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [note, setNote] = useState('');
  const [hasAttachment, setHasAttachment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const handleOcrScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatusText('กำลังตรวจสอบขนาดรูปภาพ...');
    const loadingToast = toast.loading('กำลังเริ่มสแกนด้วยรูปแบบเทมเพลต...');

    try {
      // ดึงขนาดของรูปภาพจริง
      const dimensions = await getImgSize(file);
      const imgWidth = dimensions.width;
      const imgHeight = dimensions.height;

      // ดึงข้อมูลคอนฟิกของเอกสารประเภทนี้
      const docConfig = OCR_TEMPLATES[docType];
      if (!docConfig) {
        throw new Error('ไม่พบการตั้งค่าเทมเพลตสำหรับเอกสารประเภทนี้');
      }

      // ดึง custom templates จาก localstorage (ถ้ามี)
      const customSaved = localStorage.getItem('custom_ocr_templates');
      let customTemplates: Record<string, OcrTemplate> = {};
      if (customSaved) {
        try {
          customTemplates = JSON.parse(customSaved);
        } catch (e) {
          console.error(e);
        }
      }

      // --- ขั้นตอนที่ 1: ตรวจหาบริษัท (Issuer) ด้วยกล่อง Default ---
      let detectedIssuer = '';
      const defaultKey = `${docType}_default`;
      let activeTemplate = customTemplates[defaultKey] || docConfig.default;

      // โหลด Tesseract.js
      const Tesseract = (await import('tesseract.js')).default;
      
      setScanStatusText('กำลังสร้างระบบประมวลผล OCR...');
      const worker = await Tesseract.createWorker('tha+eng');

      if (activeTemplate.issuer) {
        setScanStatusText('กำลังตรวจสอบบริษัทผู้รับประกัน...');
        setScanProgress(5);

        const rect = activeTemplate.issuer;
        const pixelRect = {
          left: Math.round(rect.left * imgWidth),
          top: Math.round(rect.top * imgHeight),
          width: Math.round(rect.width * imgWidth),
          height: Math.round(rect.height * imgHeight),
        };

        const processedImageBase64 = await preprocessOcrImage(file, pixelRect);
        const result = await worker.recognize(processedImageBase64);


        const issuerText = findIssuer(result.data.text);
        if (issuerText) {
          setIssuer(issuerText);
          detectedIssuer = issuerText;

          // ดึงเทมเพลตเฉพาะบริษัท
          const companyKey = `${docType}_by_${issuerText}`;
          if (customTemplates[companyKey]) {
            activeTemplate = customTemplates[companyKey];
            toast.success(`พบรูปแบบเทมเพลตกำหนดเองของ: ${issuerText}`, { id: loadingToast, duration: 1500 });
            toast.loading('กำลังสแกนฟิลด์ที่เหลือด้วยเทมเพลตกำหนดเอง...', { id: loadingToast });
          } else if (docConfig.byIssuer && docConfig.byIssuer[issuerText]) {
            activeTemplate = docConfig.byIssuer[issuerText];
            toast.success(`พบรูปแบบเอกสารเฉพาะของ: ${issuerText}`, { id: loadingToast, duration: 1500 });
            toast.loading('กำลังสแกนฟิลด์ที่เหลือด้วยเทมเพลตเฉพาะบริษัท...', { id: loadingToast });
          }
        }
      }

      // --- ขั้นตอนที่ 2: สแกนฟิลด์อื่นๆ ที่เหลือตามเทมเพลตที่ตรวจจับได้ ---
      const fields = Object.keys(activeTemplate).filter(f => f !== 'issuer' || !detectedIssuer);
      let fieldsFoundCount = detectedIssuer ? 1 : 0;

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const rect = activeTemplate[field];

        setScanStatusText(`กำลังสแกนช่อง: ${getFieldLabel(field)}...`);
        setScanProgress(Math.round(((i + (detectedIssuer ? 1 : 0)) / (fields.length + (detectedIssuer ? 1 : 0))) * 100));

        const pixelRect = {
          left: Math.round(rect.left * imgWidth),
          top: Math.round(rect.top * imgHeight),
          width: Math.round(rect.width * imgWidth),
          height: Math.round(rect.height * imgHeight),
        };

        const processedImageBase64 = await preprocessOcrImage(file, pixelRect);
        const result = await worker.recognize(processedImageBase64);


        const rawText = result.data.text;
        
        // แยกวิเคราะห์ค่าเฉพาะฟิลด์
        let cleanedValue: string | null = null;
        if (field === 'issuer') {
          cleanedValue = findIssuer(rawText);
        } else if (field === 'docNumber') {
          cleanedValue = findDocNumber(rawText) || rawText.trim();
        } else if (field === 'issuedDate' || field === 'expiryDate') {
          cleanedValue = extractDateFromString(rawText);
        } else if (field === 'licensePlate') {
          cleanedValue = findLicensePlate(rawText) || rawText.trim();
        } else if (field === 'chassis') {
          cleanedValue = findChassis(rawText) || rawText.trim();
        }

        if (cleanedValue) {
          if (field === 'issuer') setIssuer(cleanedValue);
          else if (field === 'docNumber') setDocNumber(cleanedValue);
          else if (field === 'issuedDate') setIssuedDate(cleanedValue);
          else if (field === 'expiryDate') setExpiryDate(cleanedValue);
          else if (field === 'licensePlate') setLicensePlate(cleanedValue);
          else if (field === 'chassis') setChassis(cleanedValue);
          fieldsFoundCount++;
        }
      }

      await worker.terminate();

      if (fieldsFoundCount > 0) {
        toast.success(`สแกนแบบเทมเพลตสำเร็จ! กรอกข้อมูลออโตฟิลด์ได้ ${fieldsFoundCount} ฟิลด์`, { id: loadingToast });
      } else {
        toast.error('สแกนเสร็จสิ้น แต่ไม่พบข้อมูลที่จับคู่ได้ กรุณากรอกด้วยตัวเอง', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดระหว่างสแกนเทมเพลต', { id: loadingToast });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      setScanStatusText('');
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chassis.trim()) {
      toast.error('กรุณากรอกเลขตัวถัง');
      return;
    }

    if (!expiryDate) {
      toast.error('กรุณาระบุวันหมดอายุ');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('กำลังบันทึกข้อมูลเอกสาร...');

    const newDoc: VehicleDocument = {
      id: createManualDocumentId(),
      chassis: chassis.trim().toUpperCase(),
      licensePlate: licensePlate.trim() || undefined,
      project: project.trim() || undefined,
      docType,
      issuer: issuer.trim() || undefined,
      docNumber: docNumber.trim() || undefined,
      issuedDate: issuedDate || undefined,
      expiryDate,
      driverName: driverName.trim() || undefined,
      note: note.trim() || undefined,
      hasAttachment,
    };

    try {
      // เรียกใช้ API บันทึกลง Neon
      const savedDocs = await createVehicleDocumentRecords([newDoc], {
        actor: 'testuser',
        source: 'manual_creation',
      });

      if (savedDocs.length > 0) {
        toast.success(`เพิ่มเอกสารรถยนต์สำเร็จเรียบร้อย`, { id: loadingToast });
        onSuccess(savedDocs[0]);
        handleClose();
      } else {
        throw new Error('No documents returned from API.');
      }
    } catch (err) {
      captureHandledError(err, { operation: 'vehicle-document.create-manual' });
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลเอกสารลงระบบ', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // รีเซ็ตค่าฟอร์มกลับเป็นค่าเริ่มต้น
    setChassis('');
    setLicensePlate('');
    setProject('');
    setDocType('act');
    setExpiryDate(defaultExpiryDate || '');
    setIssuedDate('');
    setIssuer('');
    setDocNumber('');
    setDriverName('');
    setNote('');
    setHasAttachment(true);
    setIsScanning(false);
    setScanProgress(0);
    setScanStatusText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="text-[#1a4d2e]" size={18} />
            เพิ่มเอกสาร / งานต่ออายุใหม่
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* ส่วนสแกนเอกสารด้วย OCR */}
          <div className="p-4 rounded-xl border border-dashed border-[#1a4d2e]/30 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1a4d2e] flex items-center gap-1.5">
                <FileText size={16} /> สแกนเอกสารเพื่อกรอกข้อมูลอัตโนมัติ (ฟรี)
              </span>
              {isScanning && scanProgress > 0 && scanProgress < 100 && (
                <span className="text-xs text-amber-600 font-semibold animate-pulse">
                  กำลังสแกน... {scanProgress}%
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <input
                type="file"
                id="ocr-scan-file"
                accept="image/*"
                onChange={handleOcrScan}
                disabled={isScanning}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => document.getElementById('ocr-scan-file')?.click()}
                  className="flex-1 h-10 px-4 rounded-xl text-xs font-bold border border-[#1a4d2e] text-[#1a4d2e] hover:bg-[#1a4d2e]/10 disabled:opacity-50 disabled:hover:bg-transparent transition-all flex items-center justify-center gap-2 bg-white cursor-pointer"
                >
                  เลือกไฟล์เพื่อสแกน
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => {
                    const input = document.getElementById('ocr-scan-file') as HTMLInputElement;
                    if (input) {
                      input.setAttribute('capture', 'environment');
                      input.click();
                    }
                  }}
                  className="h-10 px-4 rounded-xl text-xs font-bold bg-[#1a4d2e] text-white hover:bg-[#123620] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  ถ่ายรูปจากกล้อง
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => setIsStudioOpen(true)}
                    className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer"
                    title="ปรับแต่งพิกัดสแกน (OCR Studio)"
                  >
                    <Settings size={16} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                * รองรับรูปถ่าย พ.ร.บ., ป้ายภาษี, กรมธรรม์ หรือเล่มทะเบียน (ประมวลผลบนเบราว์เซอร์อย่างปลอดภัย 100%)
              </p>
            </div>

            {/* แสดงสถานะความคืบหน้า */}
            {isScanning && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span className="truncate max-w-[80%]">{scanStatusText}</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#1a4d2e] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ข้อมูลทั่วไป */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="chassis" className="block text-xs font-bold text-slate-500 mb-1.5">
                เลขตัวถัง (Chassis Number) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="chassis"
                required
                value={chassis}
                onChange={(e) => setChassis(e.target.value)}
                placeholder="ระบุเลขตัวถังรถยนต์"
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="licensePlate" className="block text-xs font-bold text-slate-500 mb-1.5">
                เลขทะเบียนรถ (License Plate)
              </label>
              <input
                type="text"
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="เช่น 72-4581 นครปฐม"
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project" className="block text-xs font-bold text-slate-500 mb-1.5">
                โครงการ / สัญญา (Project Name)
              </label>
              <input
                type="text"
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="ระบุโครงการที่ใช้งาน"
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="docType" className="block text-xs font-bold text-slate-500 mb-1.5">
                ประเภทเอกสาร (Document Type) <span className="text-red-500">*</span>
              </label>
              <select
                id="docType"
                required
                value={docType}
                onChange={(e) => setDocType(e.target.value as VehicleDocType)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none bg-white"
              >
                <option value="act">พ.ร.บ.</option>
                <option value="tax">ภาษีรถยนต์</option>
                <option value="insurance">ประกันภัยรถยนต์</option>
                <option value="inspection">ใบตรวจสภาพ (ตรอ.)</option>
                <option value="registration_book">คู่มือเล่มทะเบียน</option>
              </select>
            </div>
          </div>

          {/* ข้อมูลวันที่ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="issuedDate" className="block text-xs font-bold text-slate-500 mb-1.5">
                วันที่มีผลบังคับใช้ (Issued Date)
              </label>
              <input
                type="date"
                id="issuedDate"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none bg-white"
              />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-xs font-bold text-slate-500 mb-1.5">
                วันหมดอายุ (Expiry Date) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expiryDate"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* ข้อมูลเอกสารเพิ่มเติม */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="issuer" className="block text-xs font-bold text-slate-500 mb-1.5">
                บริษัทประกัน / ผู้ออกเอกสาร (Issuer)
              </label>
              <input
                type="text"
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="เช่น วิริยะประกันภัย"
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="docNumber" className="block text-xs font-bold text-slate-500 mb-1.5">
                เลขที่เอกสาร / กรมธรรม์ (Document Number)
              </label>
              <input
                type="text"
                id="docNumber"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="ระบุเลขที่เอกสาร"
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
              />
            </div>
          </div>

          {/* ผู้ขับขี่และหมายเหตุ */}
          <div>
            <label htmlFor="driverName" className="block text-xs font-bold text-slate-500 mb-1.5">
              ผู้รับผิดชอบ / พนักงานขับรถ (Driver Name)
            </label>
            <input
              type="text"
              id="driverName"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="ระบุชื่อผู้รับผิดชอบรถ"
              className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-xs font-bold text-slate-500 mb-1.5">
              หมายเหตุเพิ่มเติม (Notes)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="กรอกหมายเหตุรายละเอียดอื่น ๆ"
              rows={2}
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:ring-1 focus:ring-[#1a4d2e] focus:outline-none"
            />
          </div>

          {/* การจำลองเอกสารแนบ */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
            <div className="flex items-start gap-2 min-w-0">
              <FileText className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-slate-700">จำลองการแนบไฟล์เอกสาร (Mock Attachment)</p>
                <p className="text-[10px] text-slate-400 leading-tight">หากเปิดใช้งาน ระบบจะสร้างตัวอย่างรูปภาพหน้าเอกสารให้อัตโนมัติ</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasAttachment}
                onChange={(e) => setHasAttachment(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1a4d2e]"></div>
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="h-10 px-4 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="h-10 px-4 rounded-xl text-xs font-extrabold bg-[#1a4d2e] hover:bg-[#123620] text-white transition-all shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            บันทึกข้อมูล
          </button>
        </div>
      </div>
      {isStudioOpen && (
        <OcrTemplateStudio 
          isOpen={isStudioOpen} 
          onClose={() => setIsStudioOpen(false)} 
          initialDocType={docType} 
        />
      )}
    </div>
  );
}
