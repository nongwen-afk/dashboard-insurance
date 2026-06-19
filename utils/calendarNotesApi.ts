import type { CalendarNote } from '@/types';

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
    headers: {
      'Content-Type': 'application/json',
    },
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
  });

  const data = await response.json() as { note?: CalendarNote; error?: string };

  if (!response.ok || !data.note) {
    throw new Error(data.error || 'Unable to delete calendar note.');
  }

  return data.note;
};
