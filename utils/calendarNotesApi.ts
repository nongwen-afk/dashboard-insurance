import type { CalendarNote } from '@/types';

const getAuthHeaders = (contentType?: string) => {
  const token = process.env.NEXT_PUBLIC_API_SECRET_KEY || 'default-secret-token-for-dev';
  return {
    'Authorization': `Bearer ${token}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
};

export const listCalendarNotesRecord = async (signal?: AbortSignal) => {
  const response = await fetch('/api/calendar-notes', { signal });
  const data = await response.json() as { notes?: CalendarNote[]; error?: string };

  if (!response.ok || !data.notes) {
    throw new Error(data.error || 'Unable to load calendar notes.');
  }

  return data.notes;
};

export const createCalendarNoteRecord = async (noteDate: string, content: string) => {
  const response = await fetch('/api/calendar-notes', {
    method: 'POST',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({ noteDate, content }),
  });

  const data = await response.json() as { note?: CalendarNote; error?: string };

  if (!response.ok || !data.note) {
    throw new Error(data.error || 'Unable to create calendar note.');
  }

  return data.note;
};

export const deleteCalendarNoteRecord = async (id: string) => {
  const response = await fetch(`/api/calendar-notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json() as { note?: CalendarNote; error?: string };

  if (!response.ok || !data.note) {
    throw new Error(data.error || 'Unable to delete calendar note.');
  }

  return data.note;
};
