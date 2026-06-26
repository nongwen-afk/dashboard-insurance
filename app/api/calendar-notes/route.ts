import { createCalendarNote, listCalendarNotes } from '@/db/calendarNotes';
import { requireAuth } from '@/utils/auth';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notes = await listCalendarNotes();

    return Response.json({ notes });
  } catch (error) {
    captureHandledError(error, {
      operation: 'calendar-notes.list',
      route: '/api/calendar-notes',
    });

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
    const auth = requireAuth(request);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

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
    captureHandledError(error, {
      operation: 'calendar-notes.create',
      route: '/api/calendar-notes',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
