"use client";

import React, { useState } from 'react';
import { X, Calendar, StickyNote } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CalendarNote } from '@/types';
import { createCalendarNoteRecord } from '@/utils/calendarNotesApi';
import { captureHandledError } from '@/utils/sentry';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newNote: CalendarNote) => void;
  defaultNoteDate?: string;
}

export default function AddNoteModal({
  isOpen,
  onClose,
  onSuccess,
  defaultNoteDate,
}: AddNoteModalProps) {
  if (!isOpen) return null;

  return (
    <AddNoteForm
      key={defaultNoteDate || 'today'}
      onClose={onClose}
      onSuccess={onSuccess}
      defaultNoteDate={defaultNoteDate}
    />
  );
}

interface AddNoteFormProps {
  onClose: () => void;
  onSuccess: (newNote: CalendarNote) => void;
  defaultNoteDate?: string;
}

function AddNoteForm({
  onClose,
  onSuccess,
  defaultNoteDate,
}: AddNoteFormProps) {
  const [noteDate, setNoteDate] = useState(() => defaultNoteDate || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!noteDate) {
      toast.error('กรุณาระบุวันที่');
      return;
    }

    if (!content.trim()) {
      toast.error('กรุณากรอกข้อความโน้ต');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('กำลังบันทึกโน้ต...');

    try {
      const savedNote = await createCalendarNoteRecord(noteDate, content);
      toast.success('เพิ่มโน้ตเตือนความจำสำเร็จ', { id: loadingToast });
      onSuccess(savedNote);
      handleClose();
    } catch (err) {
      captureHandledError(err, { operation: 'calendar-note.create' });
      toast.error('เกิดข้อผิดพลาดในการบันทึกโน้ตลงระบบ', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <StickyNote className="text-amber-500" size={18} />
            เพิ่มโน้ตเตือนความจำใหม่
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="noteDate" className="block text-xs font-bold text-slate-500 mb-1.5">
              วันที่บันทึกโน้ต <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                id="noteDate"
                required
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <Calendar className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={15} />
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-xs font-bold text-slate-500 mb-1.5">
              ข้อความโน้ตเตือนความจำ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="กรอกเนื้อหาโน้ตเตือนความจำที่นี่..."
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              บันทึกโน้ต
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
