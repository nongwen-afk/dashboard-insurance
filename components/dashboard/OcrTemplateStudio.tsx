"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Eye, AlertCircle, FileText, Move, Maximize2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { VehicleDocType } from '@/types';
import { OCR_TEMPLATES } from '@/utils/ocrTemplates';
import { findChassis, findLicensePlate, findDocNumber, findIssuer, extractDateFromString } from '@/utils/ocrParser';
import { preprocessOcrImage } from '@/utils/imagePreprocessor';

interface OcrTemplateStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocType?: VehicleDocType;
}

interface Box {
  left: number; // percentage (0 to 1)
  top: number;  // percentage (0 to 1)
  width: number; // percentage (0 to 1)
  height: number; // percentage (0 to 1)
}

const FIELD_COLORS: Record<string, string> = {
  issuer: 'border-orange-500 bg-orange-500/10 text-orange-700',
  docNumber: 'border-blue-500 bg-blue-500/10 text-blue-700',
  issuedDate: 'border-purple-500 bg-purple-500/10 text-purple-700',
  expiryDate: 'border-red-500 bg-red-500/10 text-red-700',
  licensePlate: 'border-emerald-500 bg-emerald-500/10 text-emerald-700',
  chassis: 'border-cyan-500 bg-cyan-500/10 text-cyan-700',
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

const fieldsByDocType: Record<VehicleDocType, string[]> = {
  act: ['issuer', 'docNumber', 'issuedDate', 'expiryDate', 'licensePlate', 'chassis'],
  tax: ['licensePlate', 'expiryDate', 'chassis'],
  insurance: ['issuer', 'docNumber', 'issuedDate', 'expiryDate', 'licensePlate', 'chassis'],
  inspection: ['licensePlate', 'chassis', 'expiryDate'],
  registration_book: ['chassis', 'licensePlate']
};

export default function OcrTemplateStudio({ isOpen, onClose, initialDocType = 'act' }: OcrTemplateStudioProps) {
  const [docType, setDocType] = useState<VehicleDocType>(initialDocType);
  const [issuerName, setIssuerName] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // OCR Bounding boxes state
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Real-time OCR testing results
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});
  
  // Ref pointers to manage mouse actions
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; boxLeft: number; boxTop: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; boxWidth: number; boxHeight: number } | null>(null);
  const activeActionRef = useRef<'drag' | 'resize' | null>(null);

  // Load configuration or localstorage templates
  const loadTemplate = useCallback(() => {
    // 1. Try localstorage custom templates
    const saved = localStorage.getItem('custom_ocr_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const key = issuerName.trim() ? `${docType}_by_${issuerName.trim()}` : `${docType}_default`;
        if (parsed[key]) {
          setBoxes(parsed[key]);
          setTestResults({});
          return;
        }
      } catch (err) {
        console.error('Failed to parse custom templates', err);
      }
    }

    // 2. Try ocrTemplates config file byIssuer
    const docConfig = OCR_TEMPLATES[docType];
    if (docConfig) {
      if (issuerName.trim() && docConfig.byIssuer && docConfig.byIssuer[issuerName.trim()]) {
        setBoxes(docConfig.byIssuer[issuerName.trim()]);
      } else {
        setBoxes(docConfig.default);
      }
    }
    setTestResults({});
  }, [docType, issuerName]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTemplate();
    }
  }, [isOpen, loadTemplate]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setTestResults({});
  };

  const handleMouseDown = (field: string, action: 'drag' | 'resize', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActiveField(field);
    activeActionRef.current = action;
    const box = boxes[field];

    if (action === 'drag') {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        boxLeft: box.left,
        boxTop: box.top
      };
    } else if (action === 'resize') {
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        boxWidth: box.width,
        boxHeight: box.height
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeField || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const box = boxes[activeField];
    const updatedBox = { ...box };

    if (activeActionRef.current === 'drag' && dragStartRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / containerRect.width;
      const dy = (e.clientY - dragStartRef.current.y) / containerRect.height;

      updatedBox.left = Math.max(0, Math.min(1 - box.width, dragStartRef.current.boxLeft + dx));
      updatedBox.top = Math.max(0, Math.min(1 - box.height, dragStartRef.current.boxTop + dy));
      
      setBoxes(prev => ({ ...prev, [activeField]: updatedBox }));
    } else if (activeActionRef.current === 'resize' && resizeStartRef.current) {
      const dx = (e.clientX - resizeStartRef.current.x) / containerRect.width;
      const dy = (e.clientY - resizeStartRef.current.y) / containerRect.height;

      updatedBox.width = Math.max(0.02, Math.min(1 - box.left, resizeStartRef.current.boxWidth + dx));
      updatedBox.height = Math.max(0.02, Math.min(1 - box.top, resizeStartRef.current.boxHeight + dy));
      
      setBoxes(prev => ({ ...prev, [activeField]: updatedBox }));
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    resizeStartRef.current = null;
    activeActionRef.current = null;
  };

  // Run OCR on specific box to test result
  const handleTestFieldOcr = async (field: string) => {
    if (!imageFile) {
      toast.error('กรุณาอัปโหลดรูปภาพตัวอย่างก่อนสแกนทดสอบ');
      return;
    }

    const box = boxes[field];
    if (!box) return;

    setTestLoading(prev => ({ ...prev, [field]: true }));
    
    try {
      // Get natural dimensions
      const img = new Image();
      img.src = imageSrc!;
      await new Promise(r => img.onload = r);
      
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      const pixelRect = {
        left: Math.round(box.left * imgWidth),
        top: Math.round(box.top * imgHeight),
        width: Math.round(box.width * imgWidth),
        height: Math.round(box.height * imgHeight),
      };

      const Tesseract = (await import('tesseract.js')).default;
      const worker = await Tesseract.createWorker('tha+eng');
      
      const processedImageBase64 = await preprocessOcrImage(imageFile, pixelRect);
      const result = await worker.recognize(processedImageBase64);
      await worker.terminate();

      const rawText = result.data.text;
      
      // Parse using field spec
      let parsed = '';
      if (field === 'issuer') parsed = findIssuer(rawText) || '';
      else if (field === 'docNumber') parsed = findDocNumber(rawText) || rawText.trim();
      else if (field === 'issuedDate' || field === 'expiryDate') parsed = extractDateFromString(rawText) || '';
      else if (field === 'licensePlate') parsed = findLicensePlate(rawText) || rawText.trim();
      else if (field === 'chassis') parsed = findChassis(rawText) || rawText.trim();

      setTestResults(prev => ({
        ...prev,
        [field]: parsed || `(อ่านคำดิบ: "${rawText.trim().replace(/\n/g, ' ')}")`
      }));

      if (parsed) {
        toast.success(`แกะข้อมูลฟิลด์ ${getFieldLabel(field)} สำเร็จ!`);
      } else {
        toast.error(`อ่านตัวอักษรได้ แต่ไม่ผ่านเงื่อนไขฟอร์แมตฟิลด์ ${getFieldLabel(field)}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการรัน OCR');
    } finally {
      setTestLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleCopyForDev = () => {
    const key = issuerName.trim() ? `${docType}_by_${issuerName.trim()}` : `${docType}_default`;
    const dataToCopy = { [key]: boxes };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    toast.success('คัดลอกพิกัดให้โปรแกรมเมอร์แล้ว! วางในแชทได้เลย');
  };


  const handleSaveTemplate = () => {
    const key = issuerName.trim() ? `${docType}_by_${issuerName.trim()}` : `${docType}_default`;
    const saved = localStorage.getItem('custom_ocr_templates') || '{}';
    
    try {
      const parsed = JSON.parse(saved);
      parsed[key] = boxes;
      localStorage.setItem('custom_ocr_templates', JSON.stringify(parsed));
      toast.success('บันทึกเทมเพลตพิกัดสแกนลงเครื่องเรียบร้อยแล้ว!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleResetToDefault = () => {
    const docConfig = OCR_TEMPLATES[docType];
    if (docConfig) {
      setBoxes(docConfig.default);
      setTestResults({});
      setIssuerName('');
      toast.success('รีเซ็ตพิกัดกลับเป็นค่าเริ่มต้นระบบแล้ว');
    }
  };

  const activeFields = fieldsByDocType[docType];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm select-none">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <RefreshCw className="text-[#1a4d2e]" size={18} />
              OCR Template Studio (เครื่องมือจัดแต่งพิกัดกล่อง)
            </h3>
            <p className="text-xs text-slate-500">ปรับพิกัดการสแกนเฉพาะแต่ละชนิด หรือตั้งค่าตามแบบประกันแต่ละบริษัท</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center border border-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          
          {/* Left panel: Config and controls */}
          <div className="w-full md:w-80 border-r border-slate-100 p-5 overflow-y-auto space-y-5 shrink-0 bg-slate-50/20">
            <div>
              <label htmlFor="studio-docType" className="block text-xs font-bold text-slate-500 mb-1.5">
                1. เลือกประเภทเอกสาร
              </label>
              <select
                id="studio-docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value as VehicleDocType)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:outline-none bg-white"
              >
                <option value="act">พ.ร.บ.</option>
                <option value="tax">ภาษีรถยนต์</option>
                <option value="insurance">ประกันภัยรถยนต์</option>
                <option value="inspection">ใบตรวจสภาพ (ตรอ.)</option>
                <option value="registration_book">คู่มือเล่มทะเบียน</option>
              </select>
            </div>

            <div>
              <label htmlFor="studio-issuer" className="block text-xs font-bold text-slate-500 mb-1.5">
                2. ผูกกับชื่อบริษัทประกัน (ปล่อยว่างเพื่อใช้เป็นค่าดีฟอลต์)
              </label>
              <input
                type="text"
                id="studio-issuer"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                placeholder="เช่น วิริยะประกันภัย"
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-[#1a4d2e] focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                3. อัปโหลดภาพตัวอย่างเพื่อใช้เทียบตำแหน่ง
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e8f0eb] file:text-[#1a4d2e] hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500">
                4. ปรับพิกัดฟิลด์และทดสอบผล
              </label>
              
              <div className="space-y-2">
                {activeFields.map((field) => {
                  const colorClass = FIELD_COLORS[field] || 'border-slate-300';
                  const isActive = activeField === field;
                  const isLoader = testLoading[field];
                  const resultText = testResults[field];

                  return (
                    <div
                      key={field}
                      onClick={() => setActiveField(field)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive ? 'border-[#1a4d2e] bg-emerald-50/10 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full border border-current ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`} />
                          {getFieldLabel(field)}
                        </span>
                        
                        {imageFile && (
                          <button
                            type="button"
                            disabled={isLoader}
                            onClick={(e) => { e.stopPropagation(); handleTestFieldOcr(field); }}
                            className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 bg-white disabled:opacity-50"
                            title="ทดสอบอ่านเฉพาะกล่องนี้"
                          >
                            {isLoader ? (
                              <span className="h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Eye size={12} />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {resultText && (
                        <div className="mt-2 text-[10px] p-2 bg-slate-50 rounded border border-slate-100 text-slate-600 font-mono break-all leading-tight">
                          <span className="font-bold text-slate-700">ผลสแกน: </span>{resultText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Area: Interactive Bounding box canvas */}
          <div 
            className="flex-1 bg-slate-200 p-6 flex items-center justify-center overflow-auto relative min-h-0"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageSrc ? (
              <div 
                ref={containerRef}
                id="ocr-image-container"
                className="relative shadow-lg border border-slate-300 max-w-full max-h-[75vh]"
                style={{ width: 'fit-content' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageSrc} 
                  alt="OCR Document Template Preview"
                  className="max-w-full max-h-[75vh] select-none block pointer-events-none"
                  style={{ userSelect: 'none' }}
                />
                
                {/* Render bounding box overlays */}
                {activeFields.map((field) => {
                  const box = boxes[field];
                  if (!box) return null;

                  const colorClass = FIELD_COLORS[field] || 'border-slate-400 bg-slate-400/20';
                  const isActive = activeField === field;

                  return (
                    <div
                      key={field}
                      style={{
                        position: 'absolute',
                        left: `${box.left * 100}%`,
                        top: `${box.top * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`,
                      }}
                      className={`border-2 rounded transition-shadow ${colorClass} ${
                        isActive ? 'ring-2 ring-[#1a4d2e] ring-offset-1 shadow-md z-30' : 'z-20 opacity-70 hover:opacity-100'
                      }`}
                      onMouseDown={(e) => handleMouseDown(field, 'drag', e)}
                    >
                      {/* Label badge */}
                      <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[8px] font-extrabold text-white bg-slate-800 flex items-center gap-1 select-none pointer-events-none">
                        <Move size={8} />
                        {getFieldLabel(field)}
                      </div>

                      {/* Resize Handle (bottom-right corner) */}
                      {isActive && (
                        <div
                          style={{ position: 'absolute', right: -4, bottom: -4 }}
                          className="w-4 h-4 bg-slate-800 rounded-full border-2 border-white flex items-center justify-center cursor-se-resize z-40"
                          onMouseDown={(e) => handleMouseDown(field, 'resize', e)}
                        >
                          <Maximize2 size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 bg-white/70 border border-slate-300 border-dashed rounded-2xl max-w-md backdrop-blur-xs">
                <FileText className="text-slate-400 mx-auto mb-3" size={40} />
                <h4 className="font-bold text-slate-800 text-sm mb-1.5">ไม่มีเอกสารตัวอย่าง</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  กรุณาอัปโหลดภาพตัวอย่าง พ.ร.บ. หรือเอกสารชนิดอื่นของคุณทางกล่องด้านซ้ายก่อน เพื่อเทียบพิกัดแบบลากวางและทดสอบอ่านข้อมูล
                </p>
              </div>
            )}

            {/* Quick alert tips */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-800/90 text-white rounded-xl p-3 text-[10px] leading-tight flex items-start gap-2 max-w-md shadow backdrop-blur-xs z-50">
              <AlertCircle className="shrink-0 text-amber-400 mt-0.5" size={14} />
              <div>
                <span className="font-bold text-amber-400">คำแนะนำ:</span> คลิกเลือกฟิลด์ข้อมูลที่ต้องการปรับปรุงด้านซ้าย เลื่อนกรอบสีบนภาพไปยังตำแหน่งจริง และลากดึงปุ่มย่อขยายที่อยู่มุมขวาของกรอบสีเพื่อปรับขนาดให้ครอบคลุมตัวอักษร
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="h-10 px-4 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 bg-white transition-all shadow-sm"
          >
            รีเซ็ตเป็นค่าเริ่มต้น
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 bg-white transition-all shadow-sm"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleCopyForDev}
              className="h-10 px-5 rounded-xl text-xs font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 bg-white transition-all shadow-sm flex items-center gap-2"
            >
              <Save size={14} className="opacity-50" />
              คัดลอกพิกัดให้โปรแกรมเมอร์
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="h-10 px-5 rounded-xl text-xs font-extrabold bg-[#1a4d2e] hover:bg-[#123620] text-white transition-all shadow-sm flex items-center gap-2"
            >
              <Save size={14} />
              บันทึกเทมเพลต
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
