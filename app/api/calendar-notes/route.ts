import { createCalendarNote, listCalendarNotes } from '@/db/calendarNotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notes = await listCalendarNotes();

    return Response.json({ notes });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}

type CalendarNotesPostPayload = {
  noteDate?: unknown;
  content?: unknown;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json() as CalendarNotesPostPayload;

    if (typeof payload.noteDate !== 'string') {
      return Response.json({ error: 'noteDate must be a string (YYYY-MM-DD).' }, { status: 400 });
    }

    if (typeof payload.content !== 'string' || !payload.content.trim()) {
      return Response.json({ error: 'content must be a non-empty string.' }, { status: 400 });
    }

    const note = await createCalendarNote(payload.noteDate, payload.content.trim());

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
