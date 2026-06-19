import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { calendarNotes } from '@/db/schema';

export const listCalendarNotes = async () => {
  const rows = await getDb()
    .select()
    .from(calendarNotes)
    .orderBy(asc(calendarNotes.noteDate), asc(calendarNotes.createdAt));

  return rows.map((row) => ({
    id: row.id,
    noteDate: row.noteDate,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
};

export const createCalendarNote = async (noteDate: string, content: string) => {
  const [row] = await getDb()
    .insert(calendarNotes)
    .values({
      id: randomUUID(),
      noteDate,
      content,
    })
    .returning();

  return {
    id: row.id,
    noteDate: row.noteDate,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

export const deleteCalendarNote = async (id: string) => {
  const [row] = await getDb()
    .delete(calendarNotes)
    .where(eq(calendarNotes.id, id))
    .returning();

  return row ? {
    id: row.id,
    noteDate: row.noteDate,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } : null;
};
