import { deleteCalendarNote } from '@/db/calendarNotes';
import { captureHandledError } from '@/utils/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const note = await deleteCalendarNote(id);

    if (!note) {
      return Response.json({ error: 'Calendar note not found.' }, { status: 404 });
    }

    return Response.json({ note });
  } catch (error) {
    captureHandledError(error, {
      operation: 'calendar-notes.delete',
      route: '/api/calendar-notes/[id]',
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    );
  }
}
